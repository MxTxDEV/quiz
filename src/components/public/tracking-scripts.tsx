import Script from "next/script";
import type { Tracking } from "@/lib/domain/config";
import { getSetting } from "@/lib/services/settings";

/**
 * Carrega Meta Pixel / GA4 / GTM. Configuração da campanha sobrescreve a global.
 * IDs são validados por regex no schema, portanto seguros para interpolar.
 * Os eventos enviados não contêm dados pessoais (ver components/public/pixel.ts).
 */
export async function TrackingScripts({ tracking }: { tracking: Tracking }) {
  const global = await getSetting("tracking");
  const pixel = tracking.metaPixelId || global.metaPixelId;
  const ga = tracking.gaMeasurementId || global.gaMeasurementId;
  const gtm = tracking.gtmId || global.gtmId;
  const safe = (v: string) => v.replace(/[^A-Za-z0-9-]/g, "");
  return (
    <>
      {pixel && (
        <Script id="fos-meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${safe(pixel)}');fbq('track','PageView');`}
        </Script>
      )}
      {ga && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${safe(ga)}`} strategy="afterInteractive" />
          <Script id="fos-ga" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());gtag('config','${safe(ga)}',{anonymize_ip:true});`}
          </Script>
        </>
      )}
      {gtm && (
        <Script id="fos-gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${safe(gtm)}');`}
        </Script>
      )}
    </>
  );
}
