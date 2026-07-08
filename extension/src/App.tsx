import { useState, useEffect } from 'react'

function App() {
  const [analyzing, setAnalyzing] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // In a real extension, we would use chrome.tabs.sendMessage here
    // For local dev preview, we just simulate a delay
    setAnalyzing(true);
    setTimeout(() => {
      setData({
        material_score: 8.5,
        durability_score: 4.0,
        value_score: 9.2,
        gsm_context: "Heavyweight - Highly durable, holds its shape well, better for cooler weather.",
        materials_breakdown: { "Cotton": 100 },
        ai_summary: "Based on the material composition and price, this appears to be a high-quality heavyweight t-shirt. The 100% cotton construction provides breathability and durability."
      });
      setAnalyzing(false);
    }, 1500);
  }, []);

  return (
    <div className="w-[380px] min-h-[500px] bg-neutral-950 text-white font-sans p-6 overflow-hidden flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold tracking-tight">MaterialIQ</h1>
        <span className="text-xs bg-neutral-800 text-neutral-400 px-2 py-1 rounded-full border border-neutral-700">Beta</span>
      </div>

      {analyzing ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4 h-64">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-neutral-400 text-sm animate-pulse">Analyzing materials...</p>
        </div>
      ) : data ? (
        <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Main Score */}
          <div className="text-center space-y-1">
            <p className="text-sm text-neutral-400 font-medium uppercase tracking-wider">Worth It?</p>
            <div className="flex items-baseline justify-center space-x-1">
              <span className="text-6xl font-bold bg-gradient-to-br from-white to-neutral-500 text-transparent bg-clip-text">
                {data.value_score}
              </span>
              <span className="text-xl text-neutral-500">/ 10</span>
            </div>
          </div>

          <hr className="border-neutral-800" />

          {/* Breakdown */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-neutral-900 rounded-xl p-4 border border-neutral-800 flex flex-col items-center justify-center text-center">
               <span className="text-3xl font-semibold text-indigo-400 mb-1">{data.material_score}</span>
               <span className="text-xs text-neutral-400">Material Score</span>
            </div>
             <div className="bg-neutral-900 rounded-xl p-4 border border-neutral-800 flex flex-col items-center justify-center text-center">
               <span className="text-3xl font-semibold text-emerald-400 mb-1">{data.durability_score}</span>
               <span className="text-xs text-neutral-400">Durability</span>
            </div>
          </div>
          
          <div className="bg-neutral-900/50 rounded-xl p-4 border border-neutral-800/50">
             <h3 className="text-sm font-semibold mb-2">Weight & Context</h3>
             <p className="text-sm text-neutral-400 leading-relaxed">{data.gsm_context}</p>
          </div>

          <div className="bg-indigo-950/30 rounded-xl p-4 border border-indigo-500/20">
             <div className="flex items-center space-x-2 mb-2">
                <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                <h3 className="text-sm font-semibold text-indigo-200">AI Insight</h3>
             </div>
             <p className="text-sm text-indigo-200/70 leading-relaxed">{data.ai_summary}</p>
          </div>
          
          <div className="pt-4 text-center">
            <a href="#" className="text-xs text-neutral-500 hover:text-neutral-300 underline decoration-neutral-700 underline-offset-4 transition-colors">How we calculate scores</a>
          </div>

        </div>
      ) : null}
    </div>
  )
}

export default App
