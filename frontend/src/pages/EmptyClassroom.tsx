/**
 * 空闲教室查询页（方案 A：页面内自己登录 + 用户自己拖滑块）
 * 表格：每间教室一行，每节课一个格子，红=占用/有课，绿=空闲
 */
import { useEffect, useMemo, useRef, useState, Fragment } from 'react';
import { Building2, RefreshCw, LogOut, Lock, RotateCw } from 'lucide-react';
import {
  kxtoolApi,
  type KxBuilding,
  type KxFreeResult,
  type KxCaptcha,
  type KxTrack,
} from '../api/kxtool';

const PERIODS = Array.from({ length: 12 }, (_, i) => i + 1);

function today() {
  const d = new Date();
  const z = (n: number) => (n < 10 ? '0' : '') + n;
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}

export default function EmptyClassroom() {
  const [phase, setPhase] = useState<'loading' | 'login' | 'mfa' | 'main'>('loading');

  // 登录
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [code, setCode] = useState('');
  const [loginMsg, setLoginMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [cap, setCap] = useState<KxCaptcha | null>(null);
  const [pos, setPos] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ sx: 0, st: 0, active: false, width: 0 });
  const tracks = useRef<KxTrack[]>([]);

  // 查询
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
      setPhase(s.logged ? 'main' : 'login');
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

  const loadCaptcha = async () => {
    setLoginMsg('加载验证码…');
    try {
      const c = await kxtoolApi.captcha();
      if (!c.ok) {
        setLoginMsg(c.error || '获取验证码失败');
        return;
      }
      setCap(c);
      setPos(0);
      setLoginMsg('');
    } catch (e: any) {
      setLoginMsg(e?.message || '获取验证码失败');
    }
  };

  const onDown = (e: React.PointerEvent) => {
    if (!cap) return;
    const w = boxRef.current?.clientWidth || cap.bigWidth;
    drag.current = { sx: e.clientX, st: performance.now(), active: true, width: w };
    tracks.current = [{ a: 0, b: 0, c: 0 }];
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.active) return;
    const dx = Math.max(0, Math.min(d.width, e.clientX - d.sx));
    setPos(dx);
    tracks.current.push({ a: Math.round(dx), b: 0, c: Math.round(performance.now() - d.st) });
  };
  const onUp = async () => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    if (tracks.current.length < 2) {
      setLoginMsg('请按住滑块拖到缺口位置');
      return;
    }
    if (!user.trim() || !pass) {
      setLoginMsg('请先填写学号和密码');
      return;
    }
    await doLogin(d.width, tracks.current);
  };

  const doLogin = async (width: number, tks: KxTrack[]) => {
    setBusy(true);
    setLoginMsg('校验中…');
    try {
      const r = await kxtoolApi.login(user.trim(), pass, width, tks);
      if (r.ok) {
        setPass('');
        setCode('');
        setCap(null);
        setLoginMsg('');
        setPhase('main');
      } else if (r.need_mfa) {
        setLoginMsg('');
        setPhase('mfa');
      } else {
        if (r.captcha?.ok) {
          setCap(r.captcha);
          setPos(0);
        }
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
    setCap(null);
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

  // ---------- 加载 ----------
  if (phase === 'loading') return <div className="text-center text-gray-500 py-20">加载中…</div>;

  // ---------- 登录 / 二次认证 ----------
  if (phase === 'login' || phase === 'mfa') {
    return (
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h1 className="text-lg font-bold text-gray-900 flex items-center mb-1">
            <Lock className="w-5 h-5 mr-2 text-blue-600" />
            {phase === 'login' ? '登录西电统一认证' : '二次认证'}
          </h1>
          <p className="text-xs text-gray-500 mb-4">
            用你自己的西电账号登录；滑块<b>请你自己拖动</b>，不会自动识别。
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

              {!cap ? (
                <button
                  onClick={loadCaptcha}
                  className="w-full py-2.5 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                >
                  获取滑块验证码
                </button>
              ) : (
                <div>
                  <div ref={boxRef} className="relative w-full select-none">
                    <img src={`data:image/jpeg;base64,${cap.bigImage}`} alt="" className="w-full block rounded-md" draggable={false} />
                    <img
                      src={`data:image/png;base64,${cap.smallImage}`}
                      alt=""
                      draggable={false}
                      className="absolute top-0 pointer-events-none"
                      style={{ left: pos, height: '100%' }}
                    />
                  </div>
                  <div
                    className="relative mt-3 h-10 rounded-md bg-gray-100 border border-gray-200 touch-none cursor-grab"
                    onPointerDown={onDown}
                    onPointerMove={onMove}
                    onPointerUp={onUp}
                    onPointerCancel={onUp}
                  >
                    <span className="absolute inset-0 flex items-center justify-center text-xs text-gray-400 select-none">
                      按住拖动，让拼图对上缺口
                    </span>
                    <span
                      className="absolute top-0 h-full w-12 rounded-md bg-white border border-gray-300 shadow flex items-center justify-center text-gray-500"
                      style={{ left: pos }}
                    >
                      →
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <button onClick={loadCaptcha} className="text-xs text-blue-600 inline-flex items-center">
                      <RotateCw className="w-3 h-3 mr-1" />
                      换一张
                    </button>
                    {busy && <span className="text-xs text-gray-400">校验中…</span>}
                  </div>
                </div>
              )}
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
                      {PERIODS.map((p) => (
                        <td key={p} className="px-0.5 py-1.5">
                          <span
                            className={`block h-5 rounded-sm ${
                              r.free.includes(p) ? 'bg-green-500' : 'bg-red-500'
                            }`}
                          />
                        </td>
                      ))}
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
