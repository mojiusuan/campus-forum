/**
 * 空闲教室查询页
 * 数据来自 /api/kxtool（后端代理到本机 kxtool 服务，复用 ehall 会话）
 */
import { useEffect, useMemo, useState } from 'react';
import { Building2, RefreshCw, DoorOpen } from 'lucide-react';
import { kxtoolApi, type KxBuilding, type KxFreeResult } from '../api/kxtool';

function today() {
  const d = new Date();
  const z = (n: number) => (n < 10 ? '0' : '') + n;
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}

const PAIRS: [number, number][] = [
  [1, 2],
  [3, 4],
  [5, 6],
  [7, 8],
  [9, 10],
  [11, 12],
];

function fmtRanges(free: number[]) {
  const out: [number, number][] = [];
  let s = -1;
  for (let i = 1; i <= 12; i++) {
    if (free.includes(i)) {
      if (s < 0) s = i;
    } else if (s >= 0) {
      out.push([s, i - 1]);
      s = -1;
    }
  }
  if (s >= 0) out.push([s, 12]);
  return out.map(([a, b]) => (a === b ? `${a}节` : `${a}-${b}节`)).join('、');
}

export default function EmptyClassroom() {
  const [date, setDate] = useState(today());
  const [building, setBuilding] = useState('');
  const [allday, setAllday] = useState(true);
  const [buildings, setBuildings] = useState<KxBuilding[]>([]);
  const [data, setData] = useState<KxFreeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    kxtoolApi
      .buildings()
      .then((d) => setBuildings(d.buildings || []))
      .catch(() => {});
  }, []);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const d = await kxtoolApi.free(date, building, allday ? 'allday' : 'any');
      setData(d);
    } catch (e: any) {
      setError(e?.message || '查询失败');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, building, allday]);

  const groups = useMemo(() => {
    const g: Record<string, KxFreeResult['rooms']> = {};
    (data?.rooms || []).forEach((r) => {
      const k = (r.name || '').split('-')[0] || '其他';
      (g[k] = g[k] || []).push(r);
    });
    Object.keys(g).forEach((k) => g[k].sort((a, b) => (a.name < b.name ? -1 : 1)));
    return g;
  }, [data]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
          <Building2 className="w-6 h-6 mr-2 text-blue-600" />
          空闲教室
        </h1>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center px-3 py-2 rounded-md text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      {/* 筛选 */}
      <div className="flex flex-wrap gap-2 items-center bg-white border border-gray-200 rounded-lg p-3 mb-4">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
        <select
          value={building}
          onChange={(e) => setBuilding(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm min-w-[160px]"
        >
          <option value="">全部教学楼</option>
          {buildings.map((b) => (
            <option key={b.dm} value={b.dm}>
              {(b.campus || '') + (b.name || b.dm)}
            </option>
          ))}
        </select>
        <label className="inline-flex items-center text-sm text-gray-600 select-none">
          <input
            type="checkbox"
            checked={allday}
            onChange={(e) => setAllday(e.target.checked)}
            className="mr-1"
          />
          只看全天全空
        </label>
        {data && (
          <span className="text-sm text-gray-500 ml-auto">
            第 {data.week} 周 · 星期 {data.day} · {allday ? '全天全空' : '任意时段有空'} {data.count} 间
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
          {error}
        </div>
      )}

      {!error && data && data.rooms.length === 0 && (
        <div className="text-center text-gray-500 py-16">这天没有符合条件的空闲教室 🤷</div>
      )}

      {Object.keys(groups).map((k) => (
        <div key={k} className="mb-5">
          <div className="text-sm font-semibold text-gray-600 mb-2">
            {k} 楼 · {groups[k].length} 间
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {groups[k].map((r) => (
              <div
                key={r.name}
                className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
              >
                <div className="font-semibold text-gray-900 truncate" title={r.name}>
                  {r.name}
                </div>
                <div className="flex gap-1 my-2">
                  {PAIRS.map(([a, b]) => (
                    <span
                      key={a}
                      className={`flex-1 h-3 rounded-sm ${
                        r.free.includes(a) && r.free.includes(b) ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center text-xs text-green-700">
                  <DoorOpen className="w-3 h-3 mr-1" />
                  <span className="truncate" title={fmtRanges(r.free)}>
                    {fmtRanges(r.free)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <p className="text-xs text-gray-400 mt-6">
        数据来自 ehall 一站式大厅 · 每格代表 2 节（1-2 / 3-4 / … / 11-12），绿色=空闲
      </p>
    </div>
  );
}
