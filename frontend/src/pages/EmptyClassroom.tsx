/**
 * 空闲教室查询页（方案 B：用户自己登录官网 → 同步登录态）
 * 表格：每间教室一行，每节课一个格子，红=占用/有课，绿=空闲
 */
import { useEffect, useMemo, useState, Fragment } from 'react';
import { Building2, RefreshCw, LogOut, KeyRound } from 'lucide-react';
import { kxtoolApi, type KxBuilding, type KxFreeResult } from '../api/kxtool';

const PERIODS = Array.from({ length: 12 }, (_, i) => i + 1);

function today() {
  const d = new Date();
  const z = (n: number) => (n < 10 ? '0' : '') + n;
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}

export default function EmptyClassroom() {
  const [phase, setPhase] = useState<'loading' | 'sync' | 'main'>('loading');
  const [cookie, setCookie] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const [date, setDate] = useState(today());
  const [building, setBuilding] = useState('');
  const [allday, setAllday] = useState(false);
  const [buildings, setBuildings] = useState<KxBuilding[]>([]);
  const [data, setData] = useState<KxFreeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const checkStatus = async () => {
    try {
      const s = await kxtoolApi.status();
      setPhase(s.logged ? 'main' : 'sync');
    } catch {
      setPhase('sync');
    }
  };
  useEffect(() => {
    checkStatus();
  }, []);

  useEffect(() => {
    if (phase === 'main') {
      kxtoolApi
        .buildings()
        .then((d) => setBuildings(d.buildings || []))
        .catch(() => {});
    }
  }, [phase]);

  const doSync = async () => {
    if (!cookie.trim()) return;
    setBusy(true);
    setMsg('校验中…');
    try {
      const r = await kxtoolApi.sync(cookie.trim());
      if (r.ok) {
        setCookie('');
        setMsg('');
        setPhase('main');
      } else {
        setMsg(r.error || '同步失败');
      }
    } catch (e: any) {
      setMsg(e?.message || '同步失败');
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    try {
      await kxtoolApi.logout();
    } catch {
      /* ignore */
    }
    setPhase('sync');
    setData(null);
    setBuildings([]);
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const d = await kxtoolApi.free(date, building, allday ? 'allday' : 'any');
      setData(d);
    } catch (e: any) {
      setError(e?.message || '查询失败');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (phase === 'main') load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, date, building, allday]);

  const groups = useMemo(() => {
    const g: Record<string, KxFreeResult['rooms']> = {};
    (data?.rooms || []).forEach((r) => {
      const k = (r.name || '').split('-')[0] || '其他';
      (g[k] = g[k] || []).push(r);
    });
    Object.keys(g).forEach((k) => g[k].sort((a, b) => (a.name < b.name ? -1 : 1)));
    return g;
  }, [data]);

  // ---------- 同步登录态 ----------
  if (phase === 'loading') return <div className="text-center text-gray-500 py-20">加载中…</div>;
  if (phase === 'sync') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h1 className="text-lg font-bold text-gray-900 flex items-center mb-3">
            <KeyRound className="w-5 h-5 mr-2 text-blue-600" />
            同步你的西电登录态
          </h1>
          <p className="text-sm text-gray-600 mb-3">
            本工具<b>不接触你的账号密码</b>、也<b>不代过验证码</b>。请你先在官网自己登录，再把登录态同步过来。
          </p>
          <ol className="text-sm text-gray-700 list-decimal pl-5 space-y-1 mb-4">
            <li>
              浏览器打开 <span className="text-blue-600">ehall.xidian.edu.cn</span> 并<b>正常登录</b>
              （含滑块、企业号验证码）
            </li>
            <li>
              按 <b>F12</b> → Network → 随便点一个发往 <code>ehall.xidian.edu.cn</code> 的请求 →
              <b>复制它的 Cookie</b>
              <div className="text-xs text-gray-500 mt-1">
                手机（安卓 Kiwi）可装「Cookie Editor」类扩展导出 ehall 的 Cookie
              </div>
            </li>
            <li>粘贴到下面 → 点「同步」</li>
          </ol>
          <textarea
            value={cookie}
            onChange={(e) => setCookie(e.target.value)}
            rows={4}
            placeholder="粘贴 Cookie（形如 JSESSIONID=...; MOD_AUTH_CAS=...; ...）"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs font-mono mb-3"
          />
          <button
            onClick={doSync}
            disabled={busy}
            className="w-full py-2.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {busy ? '校验中…' : '同步登录态'}
          </button>
          {msg && <p className="text-sm text-red-600 mt-3">{msg}</p>}
          <p className="text-xs text-gray-400 mt-4">
            登录态只保存在服务器用于替你查询，可随时在右上角「退出」清除。
          </p>
        </div>
      </div>
    );
  }

  // ---------- 主界面 ----------
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
          <Building2 className="w-6 h-6 mr-2 text-blue-600" />
          空闲教室
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 rounded-md text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </button>
          <button
            onClick={logout}
            className="inline-flex items-center px-3 py-2 rounded-md text-sm border border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            <LogOut className="w-4 h-4 mr-1" />
            退出
          </button>
        </div>
      </div>

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
            第 {data.week} 周 · 星期 {data.day} · {allday ? '全天全空' : '任意时段有空'}{' '}
            {data.count} 间
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500 mb-2 px-1">
        <span className="inline-flex items-center">
          <span className="inline-block w-4 h-4 rounded-sm bg-green-500 mr-1" />
          空闲
        </span>
        <span className="inline-flex items-center">
          <span className="inline-block w-4 h-4 rounded-sm bg-red-500 mr-1" />
          有课/占用
        </span>
        <span>列 = 第 1~12 节</span>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
          {error}
        </div>
      )}

      {!error && data && data.rooms.length === 0 && (
        <div className="text-center text-gray-500 py-16">这天没有符合条件的空闲教室 🤷</div>
      )}

      {!error && data && data.rooms.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500">
                <th className="sticky left-0 z-10 bg-gray-50 text-left font-medium px-3 py-2 min-w-[110px]">
                  教室
                </th>
                {PERIODS.map((p) => (
                  <th key={p} className="font-normal px-0.5 py-2 text-center w-7">
                    {p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.keys(groups).map((k) => (
                <Fragment key={k}>
                  <tr>
                    <td
                      colSpan={PERIODS.length + 1}
                      className="bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1"
                    >
                      {k} 楼 · {groups[k].length} 间
                    </td>
                  </tr>
                  {groups[k].map((r) => (
                    <tr key={r.name} className="border-t border-gray-100">
                      <td className="sticky left-0 z-10 bg-white px-3 py-1.5 whitespace-nowrap font-medium text-gray-900">
                        {r.name}
                      </td>
                      {PERIODS.map((p) => {
                        const free = r.free.includes(p);
                        return (
                          <td key={p} className="px-0.5 py-1.5">
                            <span
                              className={`block h-5 rounded-sm ${
                                free ? 'bg-green-500' : 'bg-red-500'
                              }`}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-4">数据来自 ehall 一站式大厅 · 每格 = 一节课</p>
    </div>
  );
}
