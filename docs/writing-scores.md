# Writing task scores

Native task marks are displayed directly. No fixed task-to-200 conversion is invented for TOEIC.

| Exam | Individual writing task | Full writing result |
| --- | --- | --- |
| IELTS Academic | Task 1 and Task 2: band 0–9; four equally weighted criteria within each task | `(Task 1 + 2 × Task 2) / 3`, rounded to a half band for practice |
| TOEIC | Q1–5: 0–3 per picture, total 15; Q6–7: 0–4 per email, total 8; Q8: 0–5 | Native task marks total 28. ETS reports 0–200 after its scaled conversion; this app does not claim an official fixed conversion or fixed section shares of 200 |
| TOPIK II | Q51 /10; Q52 /10; Q53 /30; Q54 /50 | /100 |
| HSK 5 | Q91–98 /40; Q99 /30; Q100 /30 | Writing /100 |
| HSK 6 | Summary /100 | Writing /100 |

AI feedback is for practice. Legacy TOEIC full results containing only one email and the essay remain readable and are labelled as results from the previous calculation.

TOEIC picture tasks use the displayed photo, two required words/phrases and one original sentence. Word forms and order can change. Five answers are graded together with one quota slot; the API validates the five task IDs and scores and computes the sum itself. The current text provider uses the question bank's reference image captions, not image pixels. This limitation is stated in the result; administrators must keep captions consistent with the image. Picture sets can be added through the Writing question bank in the admin page.

A complete TOEIC practice set submits five picture answers, two distinct emails and one opinion essay. Each section retains its immutable prompt/answer/language snapshot. Successful section responses are reused on partial retry. The existing daily Writing quota counts actual section requests, and usage refreshes from the server. Changing a prompt requires confirmation before discarding a non-empty draft. Opening history never changes the active prompt or draft.

Sources:
- https://www.ets.org/toeic/about/speaking-writing.html
- https://www.ets.org/content/dam/ets-org/fr/pdfs/toeic/toeic-speaking-writing-examinee-handbook.pdf (Rating of Speaking and Writing Responses)
- https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-writing
