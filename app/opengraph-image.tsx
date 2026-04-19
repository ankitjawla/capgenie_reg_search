import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'CapGenie — Bank Regulatory Report Advisor';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 64,
          background:
            'linear-gradient(135deg, #312e81 0%, #4338ca 45%, #6366f1 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: 'white',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: 'rgba(255,255,255,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              fontWeight: 700,
            }}
          >
            C
          </div>
          <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: -0.5 }}>CapGenie</div>
          <div
            style={{
              padding: '4px 12px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.2)',
              fontSize: 16,
            }}
          >
            Regulatory Report Advisor
          </div>
        </div>

        <div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              letterSpacing: -1.5,
              lineHeight: 1.05,
              maxWidth: 1000,
            }}
          >
            Which reports does your bank need to file?
          </div>
          <div
            style={{
              marginTop: 24,
              fontSize: 28,
              opacity: 0.85,
              maxWidth: 1000,
              lineHeight: 1.3,
            }}
          >
            A LangGraph deep agent on Azure OpenAI researches a bank across US / UK / EU / India and maps it to a curated regulatory report catalog.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 20,
            opacity: 0.85,
          }}
        >
          <span>Planner → Researchers → Verifier → Synthesizer</span>
          <span>capgenie-reg-search.vercel.app</span>
        </div>
      </div>
    ),
    size,
  );
}
