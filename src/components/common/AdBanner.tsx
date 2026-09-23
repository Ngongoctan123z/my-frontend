'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

interface AdBannerProps {
  dataAdSlot: string
  dataAdFormat?: string
  dataFullWidthResponsive?: boolean
  className?: string
}

export function AdBanner({
  dataAdSlot,
  dataAdFormat = 'auto',
  dataFullWidthResponsive = true,
  className = '',
}: AdBannerProps) {
  const pathname = usePathname()

  useEffect(() => {
    // We wrap this in a timeout to ensure the DOM has rendered the <ins> tag
    // and the adsbygoogle script is loaded.
    const pushAd = () => {
      try {
        const adsbygoogle = (window as any).adsbygoogle
        if (adsbygoogle) {
          adsbygoogle.push({})
        }
      } catch (err) {
        console.error('AdSense Error:', err)
      }
    }

    // Small delay allows next/script to load
    const timer = setTimeout(pushAd, 300)
    return () => clearTimeout(timer)
  }, [pathname]) // Re-trigger on route change if needed

  return (
    <ins
      className={`adsbygoogle ${className}`}
      style={{ display: 'block' }}
      data-ad-client="ca-pub-7200108977294233"
      data-ad-slot={dataAdSlot}
      data-ad-format={dataAdFormat}
      data-full-width-responsive={dataFullWidthResponsive}
    />
  )
}
