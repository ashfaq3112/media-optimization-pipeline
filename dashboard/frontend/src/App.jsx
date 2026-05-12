import React, { useEffect, useState, useRef } from 'react'

export default function App(){
  const [prs, setPrs] = useState([])
  const [stats, setStats] = useState({})
  const chartRef = useRef(null)

  useEffect(()=>{
    fetch('/api/prs').then(r=>r.json()).then(setPrs)
    fetch('/api/prs/stats').then(r=>r.json()).then(setStats)
  },[])

  useEffect(()=>{
    if (!window.Chart || !prs.length) return
    const ctx = chartRef.current.getContext('2d')
    const labels = prs.slice(0,10).map(pr => `PR #${pr.prNumber}`)
    const data = prs.slice(0,10).map(pr => pr.savedMB || 0)

    new window.Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Space Saved (MB)',
          data,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.2)',
          fill: true,
          tension: 0.3
        }]
      }
    })
  }, [prs])

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Media Optimization Dashboard</h1>
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded shadow">
          <div className="text-sm uppercase text-gray-500">Total PRs</div>
          <div className="text-3xl font-semibold">{stats.total||0}</div>
        </div>
        <div className="bg-white p-5 rounded shadow">
          <div className="text-sm uppercase text-gray-500">Saved MB</div>
          <div className="text-3xl font-semibold">{(stats.savedMB||0).toFixed(2)}</div>
        </div>
        <div className="bg-white p-5 rounded shadow">
          <div className="text-sm uppercase text-gray-500">Last Run</div>
          <div className="text-3xl font-semibold">{prs[0] ? new Date(prs[0].timestamps.finishedAt).toLocaleString() : 'N/A'}</div>
        </div>
      </div>

      <div className="bg-white p-5 rounded shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Compression Trend</h2>
        <canvas ref={chartRef} height="120" />
      </div>

      <div className="bg-white p-5 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Recent PR Activity</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse">
            <thead>
              <tr className="border-b">
                <th className="p-3">PR</th>
                <th className="p-3">Status</th>
                <th className="p-3">Saved MB</th>
                <th className="p-3">Files</th>
              </tr>
            </thead>
            <tbody>
              {prs.map(p=> (
                <tr key={p._id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{p.prNumber} ({p.repoName})</td>
                  <td className="p-3">{p.status}</td>
                  <td className="p-3">{(p.savedMB||0).toFixed(2)}</td>
                  <td className="p-3">{(p.optimizedFiles||[]).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
