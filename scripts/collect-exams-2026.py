"""Download source PDFs, or preserve published page images in a PDF.

No question extraction, OCR, AI rewriting, or answer generation. Publication
includes successful files only; the report records every unavailable source.
"""
import concurrent.futures
import hashlib
import io
import json
import re
import time
import unicodedata
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from PIL import Image
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'public/exam-papers/2026'
MAX_BYTES = 22 * 1024 * 1024
SOURCE_HOSTS = {'thi.tuyensinh247.com', 'www.hanoi.edu.vn', 'xaydungchinhsach.chinhphu.vn'}
ASSET_SUFFIXES = ('tuyensinh247.com', 'cdnchinhphu.vn', 'shieldix.app', 'moet.gov.vn', 'hanoi.edu.vn', 'mediacdn.vn')
SELECTORS = ['#news-content', '#news_content', '#news_detail', '.content_detail', '.news-content', '.news-detail-content', '.news_detail_content', '#main-detail-body', '.detail__content', '.detail-content', '[itemprop="articleBody"]', '.singular-content']


def folded(text):
    return ''.join(c for c in unicodedata.normalize('NFD', text.lower()) if unicodedata.category(c) != 'Mn').replace('đ', 'd')


def allowed_asset(url):
    host = (urlparse(url).hostname or '').lower()
    return urlparse(url).scheme == 'https' and any(host == suffix or host.endswith('.' + suffix) for suffix in ASSET_SUFFIXES)


def get_bytes(url):
    if not allowed_asset(url):
        raise ValueError('Asset host not in source allowlist')
    for attempt in range(2):
        try:
            with requests.get(url, timeout=(12, 30), stream=True, headers={'User-Agent': 'VNDocs-ExamArchive/2026 (+https://vndocs.net)'}) as response:
                response.raise_for_status()
                if not allowed_asset(response.url):
                    raise ValueError('Unapproved redirect host')
                chunks, size = [], 0
                for chunk in response.iter_content(65536):
                    size += len(chunk)
                    if size > MAX_BYTES:
                        raise ValueError('Source exceeds asset size limit')
                    chunks.append(chunk)
                return b''.join(chunks)
        except requests.RequestException:
            if attempt:
                raise
            time.sleep(1)


def article_assets(row):
    if row.get('fileUrl'):
        return [row['fileUrl']], []
    if urlparse(row['sourceUrl']).hostname not in SOURCE_HOSTS:
        raise ValueError('Unknown source publisher')
    html = get_bytes(row['sourceUrl'])
    soup = BeautifulSoup(html, 'html.parser')
    heading = soup.find('h1')
    if not heading or '2026' not in heading.get_text(' ', strip=True):
        raise ValueError('Article heading does not identify a 2026 paper')
    containers = [(selector, soup.select_one(selector)) for selector in SELECTORS]
    candidates = [(selector, element) for selector, element in containers if element and (element.find('img') or element.find('iframe'))]
    if not candidates:
        # Report structure only, never dump article contents into build logs.
        hints = [{'tag': element.name, 'id': element.get('id'), 'class': element.get('class'), 'images': len(element.find_all('img'))} for element in soup.find_all(['article', 'div']) if element.find('img') and re.search('content|detail|article|body', ' '.join(element.get('class', [])) + str(element.get('id', '')), re.I)]
        raise ValueError('Article container not recognized: ' + json.dumps(hints[:12], ensure_ascii=False))
    selector, body = candidates[0]
    for unwanted in body.select('script,style,.related-news,.box-related,.ads,.advertisement,[data-type="relatednews"]'):
        unwanted.decompose()
    pdfs = []
    # For image-only articles, use published scan images. Do not rasterize text,
    # crop watermarks, regenerate questions, or insert guessed missing pages.
    images = []
    for image in body.find_all('img'):
        raw = image.get('data-original') or image.get('data-src') or image.get('src') or ''
        url = urljoin(row['sourceUrl'], raw).replace('http://cdn.tuyensinh247.com/', 'https://cdn.tuyensinh247.com/')
        if not allowed_asset(url) or re.search(r'logo|banner|icon|google-news|googlenews|avatar|quang-cao|quangcao|tracking', url, re.I):
            continue
        if url not in images:
            images.append(url)
    for tag in body.find_all(['a', 'iframe', 'embed']):
        raw = tag.get('href') or tag.get('src') or ''
        url = urljoin(row['sourceUrl'], raw)
        label = folded(tag.get_text(' ', strip=True) + ' ' + url)
        if re.search(r'\.pdf(?:\?|$)', url, re.I) and allowed_asset(url) and 'dap-an' not in label and 'dap an' not in label:
            pdfs.append(url)
    print(json.dumps({'source': row['slug'], 'selector': selector, 'pdfLinks': len(pdfs), 'images': len(images)}, ensure_ascii=False), flush=True)
    return list(dict.fromkeys(pdfs)), images


def collect(row):
    try:
        pdfs, images = article_assets(row)
        payload, originals, mode = None, [], None
        if pdfs:
            payload = get_bytes(pdfs[0])
            if not payload.startswith(b'%PDF-'):
                raise ValueError('PDF source returned a non-PDF body')
            originals, mode = [pdfs[0]], 'original-pdf'
        elif images:
            pages = []
            for url in images:
                try:
                    image = Image.open(io.BytesIO(get_bytes(url)))
                    if image.width < 500 or image.height < 350:
                        continue
                    image.load()
                    pages.append(image.convert('RGB'))
                    originals.append(url)
                except Exception as error:
                    # Never silently publish a paper with a failed scan page.
                    raise ValueError('Unable to obtain every scan page: ' + str(error)) from error
            if not pages:
                raise ValueError('No document-size scan images')
            buffer = io.BytesIO()
            pages[0].save(buffer, 'PDF', save_all=True, append_images=pages[1:], resolution=144, quality=95)
            payload, mode = buffer.getvalue(), 'published-images-to-pdf'
        else:
            raise ValueError('No direct PDF or published scan images found')
        if len(payload) > MAX_BYTES:
            raise ValueError('Generated PDF exceeds Cloudflare asset size limit')
        page_count = len(PdfReader(io.BytesIO(payload)).pages)
        if not 1 <= page_count <= 100:
            raise ValueError('Invalid PDF page count')
        sha = hashlib.sha256(payload).hexdigest()
        filename = row['slug'] + '.pdf'
        (OUT / filename).write_bytes(payload)
        exam = {
            **row, 'fileUrl': 'https://vndocs.net/exam-papers/2026/' + filename,
            'fileSize': len(payload), 'assetSha256': sha, 'pdfPageCount': page_count,
            'assetMode': mode, 'originalAssetUrls': originals,
            'isOfficial': True, 'hasAnswers': False, 'answerFileUrl': None,
            'thumbnailUrl': None, 'downloadCount': 0, 'viewCount': 0,
            'examCode': row['slug'], 'slugIdentifier': row['slug'], 'status': 'PUBLISHED',
            'createdAt': '2026-10-19T00:00:00.000Z', 'updatedAt': '2026-10-19T00:00:00.000Z',
        }
        print('DOWNLOADED ' + filename + ' (' + str(page_count) + ' pages)', flush=True)
        return exam, None
    except Exception as error:
        failure = {'id': row['id'], 'slug': row['slug'], 'sourceUrl': row['sourceUrl'], 'error': str(error)}
        print('UNAVAILABLE ' + row['slug'] + ': ' + str(error), flush=True)
        return None, failure


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    sources = json.loads((ROOT / 'resources/exams-2026/sources.json').read_text())
    successful, failed, hashes = [], [], set()
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        for exam, failure in pool.map(collect, sources):
            if failure:
                failed.append(failure)
            elif exam['assetSha256'] in hashes:
                failed.append({'id': exam['id'], 'slug': exam['slug'], 'error': 'Duplicate PDF bytes; not counted twice'})
                (OUT / (exam['slug'] + '.pdf')).unlink(missing_ok=True)
            else:
                successful.append(exam)
                hashes.add(exam['assetSha256'])
    successful.sort(key=lambda row: row['id'])
    (ROOT / 'src/data/exams2026.json').write_text(json.dumps(successful, ensure_ascii=False, indent=2) + '\n')
    report = {'requested': len(sources), 'downloaded': len(successful), 'unavailable': failed, 'provincesWithFiles': sorted(set(row['province'] for row in successful if row['examType'] == 'VAO_10')), 'thptSubjects': sorted(set(row['subject'] for row in successful if row['examType'] == 'THPT')), 'note': 'Metadata follows the source article. No question text or OCR was extracted. Separate official answer files have not been imported.'}
    (ROOT / 'resources/exams-2026/collection-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print('RESULT ' + json.dumps(report, ensure_ascii=False), flush=True)
    if not successful:
        raise SystemExit('No publishable PDFs were downloaded')


if __name__ == '__main__':
    main()
