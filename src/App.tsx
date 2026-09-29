import { useEffect, useMemo, useRef, useState } from 'react'
import TinderCard from 'react-tinder-card'
import {
  Ban,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Compass,
  Copy,
  Flag,
  Heart,
  Info,
  MapPin,
  Moon,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  UserRound,
  X,
} from 'lucide-react'

type Sport = '拳击' | '泰拳' | '巴西柔术' | '综合格斗' | '跆拳道'
type Tab = 'discover' | 'matches' | 'profile'
type Swipe = 'left' | 'right'
type CardApi = { swipe: (direction: Swipe) => Promise<void>; restoreCard: () => Promise<void> }

type SampleProfile = {
  id: string
  name: string
  age: number
  city: string
  sports: Sport[]
  experience: string
  gym: string
  availability: string
  preference: string
  bio: string
  photo: string
  contact: string
  likesYou: boolean
}

type MyProfile = {
  name: string
  birthday: string
  city: string
  sports: Sport[]
  experience: string
  gym: string
  bio: string
  contact: string
  photo: string
}

type DemoState = {
  started: boolean
  me: MyProfile
  swipes: Record<string, Swipe>
  matches: string[]
  unmatched: string[]
  blocked: string[]
  reports: { profileId: string; reason: string; at: string }[]
}

const STORAGE_KEY = 'duilian-demo-v1'
const THEME_KEY = 'yuejia-theme-v1'
const SPORTS: Sport[] = ['拳击', '泰拳', '巴西柔术', '综合格斗', '跆拳道']

const SAMPLE_PROFILES: SampleProfile[] = [
  {
    id: 'lin-ya',
    name: '林雅',
    age: 26,
    city: '北京',
    sports: ['拳击', '泰拳'],
    experience: '练习 3 年',
    gym: '朝阳 · 拳击训练馆',
    availability: '周末下午',
    preference: '轻量技术切磋',
    bio: '喜欢技术练习，也享受一场有来有回的轻量切磋。训练日通常在周末。',
    photo: '/profiles/lin-ya.png',
    contact: '示例账号 LINYA-DEMO',
    likesYou: true,
  },
  {
    id: 'chen-kai',
    name: '陈凯',
    age: 28,
    city: '北京',
    sports: ['拳击', '综合格斗'],
    experience: '练习 5 年',
    gym: '海淀 · 综合格斗馆',
    availability: '工作日晚间',
    preference: '站立技术交流',
    bio: '偏爱站立技术和节奏训练。希望找到水平相近、守规则的搭子。',
    photo: '/profiles/chen-kai.png',
    contact: '示例账号 CHENKAI-DEMO',
    likesYou: false,
  },
  {
    id: 'zhou-yi',
    name: '周亦',
    age: 29,
    city: '北京',
    sports: ['巴西柔术', '综合格斗'],
    experience: '练习 4 年',
    gym: '东城 · 柔术馆',
    availability: '周末 / 工作日晚',
    preference: '柔术滚练与复盘',
    bio: '喜欢滚练和复盘。训练结束以后，一起聊聊刚才那一回合。',
    photo: '/profiles/zhou-yi.png',
    contact: '示例账号 ZHOUYI-DEMO',
    likesYou: true,
  },
  {
    id: 'wu-han',
    name: '吴翰',
    age: 32,
    city: '上海',
    sports: ['泰拳', '拳击'],
    experience: '练习 6 年',
    gym: '静安 · 泰拳训练馆',
    availability: '周末上午',
    preference: '控强度实战',
    bio: '每周固定训练，重视配合与控制。欢迎在场馆里一起提高。',
    photo: '/profiles/wu-han.png',
    contact: '示例账号 WUHAN-DEMO',
    likesYou: true,
  },
]

function initialState(): DemoState {
  return {
    started: false,
    me: {
      name: '我',
      birthday: '',
      city: '北京',
      sports: ['拳击', '巴西柔术', '综合格斗'],
      experience: '练习 1 年',
      gym: '',
      bio: '想认识同城、认真训练的切磋伙伴。',
      contact: '示例账号 MY-DEMO',
      photo: '',
    },
    swipes: {},
    matches: [],
    unmatched: [],
    blocked: [],
    reports: [],
  }
}

function loadState(): DemoState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState()
    const saved = JSON.parse(raw) as DemoState
    if (!saved.me || !saved.swipes || !Array.isArray(saved.matches)) return initialState()
    return saved
  } catch {
    return initialState()
  }
}

function ageFromBirthday(birthday: string): number {
  const born = new Date(birthday + 'T00:00:00')
  if (!birthday || Number.isNaN(born.getTime())) return 0
  const now = new Date()
  let age = now.getFullYear() - born.getFullYear()
  if (now.getMonth() < born.getMonth() || (now.getMonth() === born.getMonth() && now.getDate() < born.getDate())) age--
  return age
}

function App() {
  const [demo, setDemo] = useState<DemoState>(loadState)
  const [theme, setTheme] = useState<'dark' | 'classic'>(() => {
    try { return window.localStorage.getItem(THEME_KEY) === 'classic' ? 'classic' : 'dark' }
    catch { return 'dark' }
  })
  const [tab, setTab] = useState<Tab>('discover')
  const [sportFilter, setSportFilter] = useState<Sport | '全部项目'>('全部项目')
  const [filterOpen, setFilterOpen] = useState(false)
  const [matchPopup, setMatchPopup] = useState<SampleProfile | null>(null)
  const [selectedMatch, setSelectedMatch] = useState<SampleProfile | null>(null)
  const [reportTarget, setReportTarget] = useState<SampleProfile | null>(null)
  const [reportReason, setReportReason] = useState('骚扰或不当言语')
  const [toast, setToast] = useState('')
  const [introBirthday, setIntroBirthday] = useState('')
  const [introConsent, setIntroConsent] = useState(false)
  const [introError, setIntroError] = useState('')
  const [swiping, setSwiping] = useState(false)
  const cardRef = useRef<CardApi | null>(null)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(demo))
  }, [demo])

  useEffect(() => {
    window.localStorage.setItem(THEME_KEY, theme)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0b0d0f' : '#f8f7f4')
  }, [theme])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 3200)
    return () => window.clearTimeout(timer)
  }, [toast])

  const remaining = useMemo(() => SAMPLE_PROFILES.filter((profile) => (
    profile.city === demo.me.city &&
    profile.sports.some((sport) => demo.me.sports.includes(sport)) &&
    (sportFilter === '全部项目' || profile.sports.includes(sportFilter)) &&
    !demo.swipes[profile.id] &&
    !demo.blocked.includes(profile.id) &&
    !demo.unmatched.includes(profile.id)
  )), [demo, sportFilter])
  const current = remaining[0]
  const next = remaining[1]
  const matches = SAMPLE_PROFILES.filter((profile) => demo.matches.includes(profile.id) && !demo.blocked.includes(profile.id) && !demo.unmatched.includes(profile.id))

  function updateMe(patch: Partial<MyProfile>) {
    setDemo((previous) => ({ ...previous, me: { ...previous.me, ...patch } }))
  }

  function beginDemo() {
    if (ageFromBirthday(introBirthday) < 18) {
      setIntroError('请填写真实生日；本演示仅供 18 岁及以上用户体验。')
      return
    }
    if (!introConsent) {
      setIntroError('请先确认仅在正规场馆按运动规则切磋。')
      return
    }
    setIntroError('')
    setDemo((previous) => ({ ...previous, started: true, me: { ...previous.me, birthday: introBirthday } }))
  }

  function onSwipe(profile: SampleProfile, direction: string) {
    if (direction !== 'left' && direction !== 'right') return
    setDemo((previous) => {
      if (previous.swipes[profile.id]) return previous
      const isMatch = direction === 'right' && profile.likesYou
      return {
        ...previous,
        swipes: { ...previous.swipes, [profile.id]: direction },
        matches: isMatch ? [...previous.matches, profile.id] : previous.matches,
      }
    })
    if (direction === 'right' && profile.likesYou) {
      setMatchPopup(profile)
    } else if (direction === 'right') {
      setToast('已右滑，双方都想约架才会匹配')
    }
  }

  async function swipeByButton(direction: Swipe) {
    if (!cardRef.current || swiping || !current) return
    setSwiping(true)
    try {
      await cardRef.current.swipe(direction)
    } finally {
      setSwiping(false)
    }
  }

  function unmatch(profile: SampleProfile) {
    setDemo((previous) => ({
      ...previous,
      matches: previous.matches.filter((id) => id !== profile.id),
      unmatched: [...previous.unmatched, profile.id],
    }))
    setSelectedMatch(null)
    setToast('已取消匹配，联系账号不再显示')
  }

  function block(profile: SampleProfile) {
    setDemo((previous) => ({
      ...previous,
      matches: previous.matches.filter((id) => id !== profile.id),
      blocked: [...previous.blocked, profile.id],
    }))
    setSelectedMatch(null)
    setReportTarget(null)
    setToast('已屏蔽该示例人物')
  }

  function report(profile: SampleProfile) {
    setDemo((previous) => ({
      ...previous,
      matches: previous.matches.filter((id) => id !== profile.id),
      blocked: [...previous.blocked, profile.id],
      reports: [...previous.reports, { profileId: profile.id, reason: reportReason, at: new Date().toISOString() }],
    }))
    setReportTarget(null)
    setSelectedMatch(null)
    setToast('举报已记录在此设备，并已屏蔽')
  }

  function resetDemo() {
    if (!window.confirm('重置示例滑动、匹配和资料？')) return
    window.localStorage.removeItem(STORAGE_KEY)
    setDemo(initialState())
    setTab('discover')
    setSportFilter('全部项目')
    setIntroBirthday('')
    setIntroConsent(false)
    setToast('演示已重置')
  }

  function restartDeck() {
    setDemo((previous) => ({
      ...previous,
      swipes: {},
      matches: [],
      unmatched: [],
      blocked: [],
      reports: [],
    }))
    setToast('已重新开始示例')
  }

  async function uploadPhoto(file?: File) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setToast('请选择图片文件')
      return
    }
    try {
      const bitmap = await createImageBitmap(file)
      const ratio = Math.min(1, 800 / Math.max(bitmap.width, bitmap.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(bitmap.width * ratio)
      canvas.height = Math.round(bitmap.height * ratio)
      canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      updateMe({ photo: canvas.toDataURL('image/jpeg', 0.78) })
      bitmap.close()
      setToast('照片仅保存在此浏览器')
    } catch {
      setToast('无法读取这张图片，请换一张试试')
    }
  }

  async function copyContact(contact: string) {
    try {
      await navigator.clipboard.writeText(contact)
      setToast('示例联系账号已复制')
    } catch {
      setToast('复制失败，请手动选择文字')
    }
  }

  return (
    <div className={`page ${theme === 'dark' ? 'dark-edition' : 'classic-edition'}`}>
      <aside className="desktop-aside">
        <div className="aside-brand"><span className="brand-mark">约</span><span>约架</span></div>
        <div className="aside-content">
          <div className="aside-eyebrow"><span className="status-dot" /> {theme === 'dark' ? 'DARK EDITION / 互动演示' : '格斗同好 · 互动演示'}</div>
          <h1>想约一场？<br /><em>找个对手。</em></h1>
          <p>为认真训练的人，找到下一场势均力敌的切磋。左滑跳过，右滑想约。双方同意后，再交换联系账号。</p>
          <div className="aside-note"><ShieldCheck size={18} /><span>仅限成年人 · 正规场馆 · 遵守项目规则</span></div>
        </div>
        <div className="aside-footer">示例人物与联系账号均为虚构 · 数据仅存于本浏览器</div>
      </aside>

      <main className="app" aria-label="约架演示应用">
        <header className="app-header">
          <div className="mobile-brand"><span className="brand-mark">约</span><strong>约架</strong></div>
          <div className="header-center">{tab === 'discover' ? '探索' : tab === 'matches' ? '匹配' : '我的资料'}</div>
          <div className="header-controls">
            <button className="edition-switch" type="button" aria-label={theme === 'dark' ? '切换到上一版浅色界面' : '切换到暗黑版'} title={theme === 'dark' ? '切换到经典版' : '切换到暗黑版'} onClick={() => setTheme((previous) => previous === 'dark' ? 'classic' : 'dark')}>
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}<span>{theme === 'dark' ? '经典版' : '暗黑版'}</span>
            </button>
            {tab === 'discover' && <button className="icon-button header-action" type="button" aria-label="筛选" onClick={() => setFilterOpen(true)}><SlidersHorizontal size={20} /></button>}
          </div>
        </header>

        {tab === 'discover' && (
          <section className="discover">
            <div className="discover-intro">
              <div><span className="eyebrow">{theme === 'dark' ? 'FIND YOUR OPPONENT / 同城 · 同项目' : 'DISCOVER / 同城 · 同项目'}</span><h2>找人约架<span className="heading-dot">.</span></h2><p className="discover-subtitle">{theme === 'dark' ? '挑对手。定规则。然后开场。' : '下一场，从一次右滑开始。'}</p></div>
              <span className="demo-pill"><Sparkles size={13} /> 演示人物</span>
            </div>
            <div className="deck-wrap">
              {current ? (
                <>
                  {next && <div className="deck-under" style={{ backgroundImage: 'url(' + next.photo + ')' }} aria-hidden="true" />}
                  <TinderCard
                    key={current.id}
                    ref={cardRef}
                    className="swipe-card"
                    preventSwipe={['up', 'down']}
                    swipeRequirementType="position"
                    swipeThreshold={90}
                    onSwipe={(direction) => onSwipe(current, direction)}
                  >
                    <article className="profile-card" style={{ backgroundImage: 'url(' + current.photo + ')' }}>
                      <div className="card-top"><span className="sample-label">DEMO PROFILE</span><span className="city-badge"><MapPin size={13} /> {current.city}</span></div>
                      <div className="card-bottom">
                        <div className="card-name-row"><h3>{current.name} <span>{current.age}</span></h3><span className="active-badge"><span /> 活跃中</span></div>
                        <p className="card-gym"><MapPin size={15} /> {current.gym}</p>
                        <div className="sport-tags">{current.sports.map((sport) => <span key={sport}>{sport}</span>)}<span>{current.experience}</span></div>
                        <p className="card-bio">{current.bio}</p>
                        <div className="card-availability"><Clock3 size={14} /><span>可约 {current.availability}</span><i /><span>{current.preference}</span></div>
                      </div>
                    </article>
                  </TinderCard>
                </>
              ) : (
                <div className="deck-empty">
                  <div className="empty-art"><Compass size={44} strokeWidth={1.5} /></div>
                  <h3>今天先看到这里</h3>
                  <p>换个项目或城市看看，下一位对手也许就在这里。</p>
                  <button type="button" className="secondary-button" onClick={() => setFilterOpen(true)}>调整筛选</button>
                  <button type="button" className="text-button" onClick={restartDeck}><RotateCcw size={14} /> 重新体验人物</button>
                </div>
              )}
            </div>
            <div className="actions">
              <div className="action-choice"><button className="action-button pass" type="button" aria-label="左滑，跳过" disabled={!current || swiping} onClick={() => swipeByButton('left')}><X size={29} strokeWidth={2.2} /></button><span>跳过</span></div>
              <div className="action-choice"><button className="action-button like" type="button" aria-label="右滑，想约架" disabled={!current || swiping} onClick={() => swipeByButton('right')}><Heart size={27} strokeWidth={2.2} fill="currentColor" /></button><span>想约架</span></div>
            </div>
          </section>
        )}

        {tab === 'matches' && (
          <section className="matches-screen">
            <div className="screen-heading"><span className="eyebrow">CONNECTIONS / 双向选择</span><h2>你的匹配<span className="heading-dot">.</span></h2><p>双方都右滑，联系账号才会解锁。</p></div>
            <div className="section-callout"><ShieldCheck size={17} /><span>一次匹配，一场守规则的切磋。请在正规场馆见面。</span></div>
            {matches.length ? (
              <>
                <div className="match-list">
                  {matches.map((profile) => (
                    <button type="button" className="match-row" key={profile.id} onClick={() => setSelectedMatch(profile)}>
                      <img src={profile.photo} alt={profile.name} />
                      <span className="match-row-copy"><strong>{profile.name} <span>{profile.age}</span></strong><small>{profile.sports.join(' · ')} · {profile.city}</small><em>{profile.availability}可约</em></span>
                      <span className="match-arrow"><ChevronRight size={20} /></span>
                    </button>
                  ))}
                </div>
                <div className="meet-guide">
                  <span className="eyebrow">BEFORE YOU MEET</span>
                  <h3>先聊清楚，再上场。</h3>
                  <div><span>01</span><p><strong>项目与强度</strong><small>约定双方熟悉的规则和接触强度</small></p></div>
                  <div><span>02</span><p><strong>时间与场馆</strong><small>选择正规场馆，确认可用时段</small></p></div>
                  <div><span>03</span><p><strong>护具与边界</strong><small>提前说清护具、停手信号和禁用动作</small></p></div>
                </div>
              </>
            ) : (
              <div className="screen-empty"><div className="empty-art small"><Heart size={35} /></div><h3>还没有匹配</h3><p>去探索页右滑想约架的人，双方都选择后就会出现在这里。</p><button type="button" className="primary-button" onClick={() => setTab('discover')}>开始探索</button></div>
            )}
          </section>
        )}

        {tab === 'profile' && (
          <section className="profile-screen">
            <div className="screen-heading"><span className="eyebrow">YOUR CORNER / 个人档案</span><h2>我的资料<span className="heading-dot">.</span></h2><p>写清你的项目和常去场馆，让合适的人更容易找到你。</p></div>
            <div className="my-photo-row">
              <label className="my-photo" title="上传照片">{demo.me.photo ? <img src={demo.me.photo} alt="我的头像" /> : <UserRound size={32} />}<span className="camera-badge"><Camera size={13} /></span><input type="file" accept="image/*" onChange={(event) => uploadPhoto(event.target.files?.[0])} /></label>
              <div><strong>{demo.me.name || '你的名字'}</strong><p>照片只保存在当前浏览器；示例版不会上传到服务器。</p></div>
            </div>
            <div className="form-grid">
              <label>称呼<input value={demo.me.name} maxLength={24} onChange={(event) => updateMe({ name: event.target.value })} /></label>
              <label>生日<input type="date" value={demo.me.birthday} onChange={(event) => updateMe({ birthday: event.target.value })} /></label>
              <label>所在城市<input value={demo.me.city} maxLength={24} onChange={(event) => updateMe({ city: event.target.value })} /></label>
              <label>训练经验<input value={demo.me.experience} maxLength={30} onChange={(event) => updateMe({ experience: event.target.value })} /></label>
              <label className="full">常去场馆<input value={demo.me.gym} maxLength={60} placeholder="例如：朝阳区某拳击馆" onChange={(event) => updateMe({ gym: event.target.value })} /></label>
              <div className="full field-group"><span className="field-label">我的项目</span><div className="choice-chips">{SPORTS.map((sport) => <button type="button" key={sport} className={demo.me.sports.includes(sport) ? 'choice-chip selected' : 'choice-chip'} onClick={() => updateMe({ sports: demo.me.sports.includes(sport) ? demo.me.sports.filter((item) => item !== sport) : [...demo.me.sports, sport] })}>{sport}</button>)}</div></div>
              <label className="full">个人介绍<textarea rows={3} value={demo.me.bio} maxLength={160} onChange={(event) => updateMe({ bio: event.target.value })} /></label>
              <label className="full">联系账号<input value={demo.me.contact} maxLength={80} onChange={(event) => updateMe({ contact: event.target.value })} /><small>在真实版本中，仅双方匹配后才会交换。</small></label>
            </div>
            <div className="profile-notice"><Info size={18} /><span>这是本机演示：资料、照片和举报记录仅保存在你的浏览器中，没有真实用户登录或后台审核。</span></div>
            <button type="button" className="text-button reset-link" onClick={resetDemo}><RotateCcw size={15} /> 重置全部演示数据</button>
          </section>
        )}

        <nav className="bottom-nav" aria-label="主要导航">
          <button type="button" className={tab === 'discover' ? 'active' : ''} onClick={() => setTab('discover')}><Compass size={23} /><span>探索</span></button>
          <button type="button" className={tab === 'matches' ? 'active' : ''} onClick={() => setTab('matches')}><span className="nav-icon-wrap"><Heart size={23} />{matches.length > 0 && <i />}</span><span>匹配</span></button>
          <button type="button" className={tab === 'profile' ? 'active' : ''} onClick={() => setTab('profile')}><UserRound size={23} /><span>我的</span></button>
        </nav>
      </main>

      {filterOpen && (
        <div className="overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setFilterOpen(false) }}>
          <section className="sheet" role="dialog" aria-modal="true" aria-label="探索筛选">
            <div className="sheet-handle" /><div className="sheet-title"><h2>探索设置</h2><button type="button" className="icon-button" aria-label="关闭" onClick={() => setFilterOpen(false)}><X size={22} /></button></div>
            <p>优先展示同城且与你有共同训练项目的人。</p>
            <div className="filter-item"><span>所在城市</span><strong><MapPin size={15} /> {demo.me.city || '未填写'}</strong></div>
            <div className="filter-group"><span>训练项目</span><div className="choice-chips"><button type="button" className={sportFilter === '全部项目' ? 'choice-chip selected' : 'choice-chip'} onClick={() => setSportFilter('全部项目')}>全部项目</button>{SPORTS.map((sport) => <button type="button" key={sport} className={sportFilter === sport ? 'choice-chip selected' : 'choice-chip'} onClick={() => setSportFilter(sport)}>{sport}</button>)}</div></div>
            <button type="button" className="primary-button full-button" onClick={() => setFilterOpen(false)}>查看人物</button>
          </section>
        </div>
      )}

      {matchPopup && (
        <div className="overlay match-overlay" role="dialog" aria-modal="true" aria-label="匹配成功">
          <div className="match-modal">
            <div className="match-spark one">✦</div><div className="match-spark two">✦</div><div className="match-spark three">✦</div>
            <div className="match-portraits"><div className="match-me">{demo.me.photo ? <img src={demo.me.photo} alt="我的头像" /> : <UserRound size={42} />}</div><div className="match-heart"><Heart size={22} fill="currentColor" /></div><img src={matchPopup.photo} alt={matchPopup.name} /></div>
            <span className="match-kicker">IT'S A MATCH</span><h2>约架成功！</h2><p>你和 {matchPopup.name} 都想约一场。<br />先交换联系账号，再约正规场馆。</p>
            <button type="button" className="white-button" onClick={() => { setSelectedMatch(matchPopup); setMatchPopup(null); setTab('matches') }}>查看匹配</button>
            <button type="button" className="match-later" onClick={() => setMatchPopup(null)}>继续探索</button>
          </div>
        </div>
      )}

      {selectedMatch && (
        <div className="overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedMatch(null) }}>
          <section className="detail-modal" role="dialog" aria-modal="true" aria-label={selectedMatch.name + '的匹配资料'}>
            <div className="detail-cover" style={{ backgroundImage: 'url(' + selectedMatch.photo + ')' }}><button type="button" className="back-button" aria-label="返回" onClick={() => setSelectedMatch(null)}><ChevronLeft size={23} /></button></div>
            <div className="detail-content"><div className="detail-title"><h2>{selectedMatch.name} <span>{selectedMatch.age}</span></h2><span className="sample-mini">演示人物</span></div><p><MapPin size={16} /> {selectedMatch.city} · {selectedMatch.gym}</p><div className="sport-tags dark">{selectedMatch.sports.map((sport) => <span key={sport}>{sport}</span>)}</div><p className="detail-bio">{selectedMatch.bio}</p><div className="detail-session"><div><span>可约时间</span><strong>{selectedMatch.availability}</strong></div><div><span>切磋偏好</span><strong>{selectedMatch.preference}</strong></div></div>
              <div className="contact-card"><div><small>双方匹配后可见</small><strong>{selectedMatch.contact}</strong></div><button type="button" aria-label="复制联系账号" onClick={() => copyContact(selectedMatch.contact)}><Copy size={18} /></button></div>
              <div className="detail-actions"><button type="button" onClick={() => unmatch(selectedMatch)}><X size={17} /> 取消匹配</button><button type="button" onClick={() => block(selectedMatch)}><Ban size={17} /> 屏蔽</button><button type="button" onClick={() => { setReportReason('骚扰或不当言语'); setReportTarget(selectedMatch) }}><Flag size={17} /> 举报</button></div>
            </div>
          </section>
        </div>
      )}

      {reportTarget && (
        <div className="overlay report-overlay"><section className="report-modal" role="dialog" aria-modal="true" aria-label="举报示例人物"><button type="button" className="back-button report-close" aria-label="关闭" onClick={() => setReportTarget(null)}><X size={20} /></button><Flag size={28} className="report-icon" /><h2>举报 {reportTarget.name}</h2><p>演示版会把举报记录保存在此浏览器，并屏蔽这位示例人物。</p><label>原因<select value={reportReason} onChange={(event) => setReportReason(event.target.value)}><option>骚扰或不当言语</option><option>虚假资料</option><option>危险或违规邀约</option><option>其他</option></select></label><button type="button" className="primary-button full-button" onClick={() => report(reportTarget)}>提交举报并屏蔽</button></section></div>
      )}

      {!demo.started && (
        <div className="overlay intro-overlay">
          <section className="intro-modal" role="dialog" aria-modal="true" aria-label="开始体验"><div className="intro-icon"><ShieldCheck size={26} /></div><span className="eyebrow">欢迎来到约架</span><h2>先确认两件事</h2><p>这是虚构人物的互动演示。约架指成年人在正规场馆按运动规则切磋。</p><label>你的生日<input type="date" value={introBirthday} onChange={(event) => setIntroBirthday(event.target.value)} /></label><label className="checkbox-row"><input type="checkbox" checked={introConsent} onChange={(event) => setIntroConsent(event.target.checked)} /><span>我已满 18 岁，只在正规场馆按规则切磋</span></label>{introError && <p className="form-error" role="alert">{introError}</p>}<button type="button" className="primary-button full-button" onClick={beginDemo}>开始体验 <ChevronRight size={19} /></button><small>生日自填不等于实名年龄核验</small></section>
        </div>
      )}

      {toast && <div className="toast" role="status"><Check size={17} /> {toast}</div>}
    </div>
  )
}

export default App
