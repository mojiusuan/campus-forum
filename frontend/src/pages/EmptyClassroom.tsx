/**
 * 空闲教室查询页
 * 每个用户用自己的西电账号登录（学号+密码 → 企业号验证码），会话在本机服务侧隔离保存
 */
import { useEffect, useMemo, useState } from 'react';
import { Building2, RefreshCw, DoorOpen, LogOut, Lock } from 'lucide-react';
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
  const [phase, setPhase] = useState<'loading' | 'login' | 'mfa' | 'main'>('loading');
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [code, setCode] = useState('');
  const [loginMsg, setLoginMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const [date, setDate] = useState(today());
  const [building, setBuilding] = useState('');
  const [allday, setAllday] = useState(true);
  const [buildings, setBuildings] = useState<KxBuilding[]>([]);
  const [data, setData] = useState<KxFreeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const checkStatus = async () => {
    try {
      const s = await kxtoolApi.status();
      if (s.logged) setPhase('main');
      else if (s.mfa_pending) setPhase('mfa');
      else setPhase('login');
    } catch {
      setPhase('login');
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

  const doLogin = async () => {
    if (!user.trim() || !pass) return;
    setBusy(true);
    setLoginMsg('正在处理滑块验证码…');
    try {
      const r = await kxtoolApi.login(user.trim(), pass);
      if (r.ok) {
        setLoginMsg('');
        setPass('');
        setPhase('main');
      } else if (r.need_mfa) {
        setLoginMsg('');
        setPhase('mfa');
      } else {
        setLoginMsg(r.error || '登录失败');
      }
    } catch (e: any) {
      setLoginMsg(e?.message || '登录失败');
    } finally {
      setBusy(false);
    }
  };

  const doMfa = async () => {
    if (!code.trim()) return;
    setBusy(true);
    setLoginMsg('');
    try {
      const r = await kxtoolApi.mfa(code.trim());
      if (r.ok) {
        setCode('');
        setPhase('main');
      } else {
        setLoginMsg(r.error || '验证码错误');
      }
    } catch (e: any) {
      setLoginMsg(e?.message || '提交失败');
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
    setPhase('login');
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
      if (e?.code === 'UNKNOWN_ERROR' || e?.message) setError(e.message || '查询失败');
      // 会话失效 → 回到登录
      if (String(e?.message || '').includes('未登录')) setPhase('login');
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

  // ---------- 登录 / 验证码 ----------
  if (phase === 'loading') {
    return <div className="text-center text-gray-500 py-20">加载中…</div>;
  }
  if (phase === 'login' || phase === 'mfa') {
    return (
      <div className="max-w-md mx-auto px-4 py-10">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h1 className="text-lg font-bold text-gray-900 flex items-center mb-1">
            <Lock className="w-5 h-5 mr-2 text-blue-600" />
            {phase === 'login' ? '登录西电统一认证' : '二次认证'}
          </h1>
          <p className="text-xs text-gray-500 mb-4">
            用你自己的西电账号登录，仅用于查询空闲教室；会话保存在服务器端，不记录你的密码。
          </p>

          {phase === 'login' ? (
            <>
              <input
                value={user}
                onChange={(e) => setUser(e.target.value)}
                placeholder="学号"
                autoComplete="username"
                className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3"
              />
              <input
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                type="password"
                placeholder="密码"
                autoComplete="current-password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3"
              />
              <button
                onClick={doLogin}
                disabled={busy}
                className="w-full py-2.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {busy ? '登录中…' : '登录（自动过滑块）'}
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-3">
                验证码已发送到你的<b>西电企业号</b>，请查收并输入 6 位数字。
              </p>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                inputMode="numeric"
                maxLength={6}
                placeholder="6 位验证码"
                className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3 text-center tracking-widest"
              />
              <button
                onClick={doMfa}
                disabled={busy}
                className="w-full py-2.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {busy ? '提交中…' : '提交'}
              </button>
            </>
          )}

          {loginMsg && <p className="text-sm text-red-600 mt-3">{loginMsg}</p>}
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
