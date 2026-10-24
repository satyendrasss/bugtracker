import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, apiPost, apiPatch, apiDelete, enumToLabel, labelToEnum, mapProject, mapUser, mapIssue, dateOnly, downloadAttachment, fetchAll } from "./api.js";
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Activity, AlertCircle, ArrowDown, ArrowLeft, ArrowUp, Bell, Bug, CalendarDays,
  Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Clock3,
  Download, Ellipsis, Eye, FileBarChart, Filter, FolderKanban, Gauge, Home,
  LayoutDashboard, ListFilter, LockKeyhole, LogOut, Menu, MoreHorizontal, Pencil,
  Plus, Search, Settings as SettingsIcon, ShieldCheck, SlidersHorizontal, Trash2,
  TrendingDown, TrendingUp, UserRound, Users, X, Zap, CircleX, ChartNoAxesCombined
} from "lucide-react";

const StoreContext = createContext(null);
const initials = (name = "") => name.split(" ").filter(Boolean).slice(0, 2).map(s => s[0]).join("").toUpperCase();
const today = new Date();
const dateLabel = (offset = 0) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};
const seedIssues = [
  { id: "BUG-001", title: "Login button not working", description: "Clicking login does not redirect users to the dashboard. The submit action appears to complete, but the page stays on the login screen.", projectId: "P-1", priority: "High", status: "Open", assignee: "John Doe", reporter: "Satyendra Singh", created: dateLabel(-5), due: dateLabel(2), type: "Bug", comments: [{ author: "Alice Smith", text: "I can reproduce this in Chrome and Firefox.", time: "Today, 9:10 AM" }] },
  { id: "BUG-002", title: "UI alignment issue on dashboard", description: "Widgets are not properly aligned at tablet breakpoints and the summary cards wrap inconsistently.", projectId: "P-1", priority: "Medium", status: "In Progress", assignee: "Alice Smith", reporter: "John Doe", created: dateLabel(-6), due: dateLabel(3), type: "Bug", comments: [] },
  { id: "BUG-003", title: "API returning 500 error", description: "The issues endpoint intermittently returns an internal server error when the filter query is present.", projectId: "P-2", priority: "High", status: "Open", assignee: "Robert Johnson", reporter: "Satyendra Singh", created: dateLabel(-7), due: dateLabel(1), type: "Bug", comments: [{ author: "Robert Johnson", text: "Investigating the API logs now.", time: "Yesterday, 4:22 PM" }] },
  { id: "BUG-004", title: "Typo in settings page", description: "The label 'Prefernces' should be corrected to 'Preferences'.", projectId: "P-1", priority: "Low", status: "Resolved", assignee: "Sarah Wilson", reporter: "Alice Smith", created: dateLabel(-8), due: dateLabel(-1), type: "Task", comments: [] },
  { id: "BUG-005", title: "Database connection timeout", description: "Connection pool timeout after 30 seconds under high request volume.", projectId: "P-2", priority: "High", status: "In Progress", assignee: "Mike Kumar", reporter: "Robert Johnson", created: dateLabel(-9), due: dateLabel(4), type: "Bug", comments: [] },
  { id: "BUG-006", title: "Mobile view broken", description: "Layout breaks on small screens; the side navigation covers the primary action button.", projectId: "P-1", priority: "Medium", status: "Open", assignee: "John Doe", reporter: "Sarah Wilson", created: dateLabel(-10), due: dateLabel(5), type: "Bug", comments: [] },
  { id: "BUG-007", title: "Incorrect data in report", description: "Numbers mismatch in the export when a date range is selected.", projectId: "P-3", priority: "Medium", status: "In Progress", assignee: "Alice Smith", reporter: "Satyendra Singh", created: dateLabel(-11), due: dateLabel(2), type: "Bug", comments: [] },
  { id: "BUG-008", title: "Slow performance on large data", description: "The issues page takes too long to load when there are more than 10,000 records.", projectId: "P-2", priority: "Low", status: "Resolved", assignee: "Robert Johnson", reporter: "Mike Kumar", created: dateLabel(-12), due: dateLabel(-2), type: "Improvement", comments: [] },
  { id: "BUG-009", title: "Error message not user friendly", description: "Show a clear message when the user enters invalid input instead of a generic error.", projectId: "P-1", priority: "Low", status: "Closed", assignee: "Sarah Wilson", reporter: "John Doe", created: dateLabel(-13), due: dateLabel(-3), type: "Improvement", comments: [] },
  { id: "BUG-010", title: "Feature request: Export to PDF", description: "Add an option to export reports as a PDF document.", projectId: "P-3", priority: "Medium", status: "Open", assignee: "Mike Kumar", reporter: "Alice Smith", created: dateLabel(-14), due: dateLabel(7), type: "Feature", comments: [] }
];
const seedProjects = [
  { id: "P-1", name: "Web App", key: "WEB", description: "Customer-facing web application and dashboard experience.", lead: "John Doe", status: "Active", color: "#2875ed", due: dateLabel(30) },
  { id: "P-2", name: "API Service", key: "API", description: "Core API, service reliability, and backend performance.", lead: "Robert Johnson", status: "Active", color: "#8b5cf6", due: dateLabel(45) },
  { id: "P-3", name: "Analytics", key: "ANL", description: "Reporting, analytics, and data export features.", lead: "Alice Smith", status: "Active", color: "#0eaa72", due: dateLabel(60) }
];
const seedUsers = [
  { id: "U-1", name: "Satyendra Singh", email: "satyendra@example.com", role: "Admin", status: "Active", joined: dateLabel(-90) },
  { id: "U-2", name: "John Doe", email: "john@example.com", role: "Developer", status: "Active", joined: dateLabel(-60) },
  { id: "U-3", name: "Alice Smith", email: "alice@example.com", role: "Developer", status: "Active", joined: dateLabel(-50) },
  { id: "U-4", name: "Robert Johnson", email: "robert@example.com", role: "Developer", status: "Active", joined: dateLabel(-45) },
  { id: "U-5", name: "Sarah Wilson", email: "sarah@example.com", role: "QA Engineer", status: "Active", joined: dateLabel(-30) },
  { id: "U-6", name: "Mike Kumar", email: "mike@example.com", role: "Project Manager", status: "Invited", joined: dateLabel(-3) }
];
function load(key, fallback) {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; } catch { return fallback; }
}

function StoreProvider({ children }) {
  const [issues, setIssues] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState(() => load("bt_user", {name:"User", email:"", role:""}));
  const [settings, setSettings] = useState({ workspace: "BugTracker", emailNotifications: true, weeklySummary: false, compactMode: false });
  const [loading, setLoading] = useState(Boolean(localStorage.getItem("bt_access_token")));
  const [apiError, setApiError] = useState("");
  const refreshData = async () => {
    setLoading(true); setApiError("");
    try {
      const [issueItems, projectItems, userItems, settingData, profileData] = await Promise.all([
        fetchAll("/issues"), fetchAll("/projects"), fetchAll("/users").catch(()=>[]), api("/settings"), api("/auth/me")
      ]);
      setIssues(issueItems.map(mapIssue));
      setProjects(projectItems.map(mapProject));
      setUsers(userItems.map(mapUser));
      setSettings({workspace:"BugTracker",emailNotifications:true,weeklySummary:false,compactMode:false,...settingData});
      const nextUser = {...profileData, role: enumToLabel(profileData.role)};
      setUser(nextUser); localStorage.setItem("bt_user", JSON.stringify(nextUser));
    } catch (error) { setApiError(error.message || "Could not load data from the API."); }
    finally { setLoading(false); }
  };
  useEffect(() => { if (localStorage.getItem("bt_access_token")) refreshData(); else { setIssues([]); setProjects([]); setUsers([]); } }, []);
  const value = { issues, setIssues, projects, setProjects, users, setUsers, user, setUser, settings, setSettings, loading, apiError, refreshData };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
const useStore = () => useContext(StoreContext);

function App() {
  return <StoreProvider><Routes>
    <Route path="/login" element={<AuthPage mode="login" />} />
    <Route path="/register" element={<AuthPage mode="register" />} />
    <Route path="/forgot-password" element={<AuthPage mode="forgot" />} />
    <Route path="/*" element={<Shell />} />
  </Routes></StoreProvider>;
}

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/issues", label: "Issues", icon: Bug },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/users", label: "Users", icon: Users },
  { to: "/reports", label: "Reports", icon: ChartNoAxesCombined },
  { to: "/settings", label: "Settings", icon: SettingsIcon }
];

function Shell() {
  const { user, loading, apiError, refreshData } = useStore();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const isNewIssue = location.pathname === "/issues/new";
  const isIssueDetail = location.pathname.startsWith("/issues/") && !isNewIssue;
  if (!localStorage.getItem("bt_access_token")) return <Navigate to="/login" replace />;
  if (loading) return <div className="loading-screen">Connecting to BugTracker API…</div>;
  const title = location.pathname === "/" ? "Dashboard" : location.pathname.startsWith("/issues") ? (isNewIssue ? "Report New Issue" : isIssueDetail ? "Issue Details" : "Issues") : location.pathname.startsWith("/projects") ? "Projects" : location.pathname.startsWith("/users") ? "Users" : location.pathname.startsWith("/reports") ? "Reports" : "Settings";
  return <div className="app-shell">{apiError && <div className="api-error-banner"><AlertCircle size={16}/><span>{apiError}</span><button onClick={refreshData}>Retry</button></div>}
    <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
      <Link to="/" className="brand" onClick={() => setMobileOpen(false)}><span className="brand-mark"><Bug size={25} strokeWidth={2.4}/></span><span><b>BugTracker</b><small>Track · Manage · Fix</small></span></Link>
      <nav className="side-nav">{navItems.filter(item => item.to !== "/users" || user?.role === "Admin").map(item => <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setMobileOpen(false)} className={({isActive}) => `nav-link ${isActive ? "active" : ""}`}><item.icon size={19}/><span>{item.label}</span></NavLink>)}</nav>
      <div className="sidebar-bottom"><div className="version">BugTracker v1.0.0<br/>© 2025</div><button className="sidebar-user" onClick={() => setProfileOpen(!profileOpen)}><Avatar name={user.name}/><span className="user-text"><b>{user.name}</b><small>{user.role}</small></span><ChevronDown size={15}/></button>{profileOpen && <div className="profile-menu"><Link to="/settings" onClick={() => setProfileOpen(false)}><UserRound size={15}/> My profile</Link><button onClick={async()=>{try{await apiPost("/auth/logout",{});}catch{}localStorage.removeItem("bt_access_token");localStorage.removeItem("bt_user");window.location.href="/login";}}><LogOut size={15}/> Sign out</button></div>}</div>
    </aside>
    {mobileOpen && <button aria-label="Close menu" className="mobile-scrim" onClick={() => setMobileOpen(false)} />}
    <main className="main-area">
      <header className="topbar"><button className="icon-button mobile-menu-button" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={21}/></button><div className="global-search"><Search size={18}/><input placeholder="Search issues, titles, or keywords..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => { if(e.key === "Enter") window.location.href = `/issues?search=${encodeURIComponent(search)}`; }}/>{search && <button onClick={() => setSearch("")} aria-label="Clear search"><X size={15}/></button>}</div><div className="topbar-actions"><div className="notification-wrap"><button className="icon-button notification-button" onClick={() => setShowNotifications(!showNotifications)} aria-label="Notifications"><Bell size={20}/><i>3</i></button>{showNotifications && <div className="notification-popover"><h3>Notifications <span className="pill blue">3 new</span></h3><ActivityItem color="blue" title="New issue assigned to you" text="Login button not working" time="10 min ago"/><ActivityItem color="yellow" title="Issue status updated" text="UI alignment issue on dashboard" time="1 hour ago"/><ActivityItem color="green" title="Issue resolved" text="Typo in settings page" time="Yesterday"/></div>}</div><span className="topbar-divider"/><Avatar name={user.name}/><div className="topbar-user"><b>{user.name}</b><small>{user.role}</small></div><button className="icon-button profile-caret" onClick={() => setProfileOpen(!profileOpen)}><ChevronDown size={15}/></button>{profileOpen && <div className="top-profile-menu"><Link to="/settings">My profile</Link><Link to="/login">Sign out</Link></div>}</div></header>
      <div className="page-wrap"><Routes>
        <Route path="/" element={<Dashboard/>}/>
        <Route path="/issues" element={<IssuesPage/>}/>
        <Route path="/issues/new" element={<IssueFormPage/>}/>
        <Route path="/issues/:id" element={<IssueDetailPage/>}/>
        <Route path="/issues/:id/edit" element={<IssueFormPage/>}/>
        <Route path="/projects" element={<ProjectsPage/>}/>
        <Route path="/projects/:id" element={<ProjectDetailPage/>}/>
        <Route path="/users" element={<UsersPage/>}/>
        <Route path="/reports" element={<ReportsPage/>}/>
        <Route path="/settings" element={<SettingsPage/>}/>
        <Route path="*" element={<NotFound/>}/>
      </Routes></div>
    </main>
  </div>;
}

function PageHeading({ title, subtitle, action, back }) {
  return <div className="page-heading">{back && <button className="back-button" onClick={back}><ArrowLeft size={17}/></button>}<div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{action && <div className="heading-action">{action}</div>}</div>;
}
function Button({ children, variant = "primary", icon: Icon, onClick, type = "button", className = "" }) {
  return <button type={type} onClick={onClick} className={`btn btn-${variant} ${className}`}>{Icon && <Icon size={16} />}{children}</button>;
}
function Avatar({ name, size = "normal" }) {
  const colors = ["#4263b4", "#6e86a0", "#27a67a", "#8c64cc", "#c58b3e", "#367f9b"];
  const idx = [...(name || "A")].reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
  return <span className={`avatar ${size === "small" ? "avatar-small" : ""}`} style={{background: colors[idx]}}>{initials(name)}</span>;
}
function StatusBadge({ status }) {
  const key = (status || "").toLowerCase().replaceAll(" ", "-");
  return <span className={`pill status-${key}`}>{status}</span>;
}
function PriorityBadge({ priority }) {
  return <span className={`pill priority-${(priority || "low").toLowerCase()}`}>{priority}</span>;
}
function ProjectName({ projectId }) {
  const { projects } = useStore();
  const project = projects.find(p => p.id === projectId);
  return <span>{project?.name || "Unassigned"}</span>;
}
function EmptyState({ icon: Icon = Bug, title, text, action }) {
  return <div className="empty-state"><span className="empty-icon"><Icon size={24}/></span><h3>{title}</h3><p>{text}</p>{action}</div>;
}
function MetricCard({ title, value, icon: Icon, tone, change, trend = "up", detail = "from last week" }) {
  return <div className="metric-card"><div className={`metric-icon ${tone}`}><Icon size={22}/></div><div className="metric-info"><span>{title}</span><strong>{value}</strong><small className={trend === "down" ? "trend-down" : "trend-up"}>{trend === "down" ? <ArrowDown size={14}/> : <ArrowUp size={14}/>} <b>{change}</b> {detail}</small></div></div>;
}
function ActivityItem({ color = "blue", title, text, time }) {
  return <div className="activity-item"><span className={`activity-dot ${color}`}><Check size={13}/></span><div><b>{title}</b><p>{text}</p><small>{time}</small></div></div>;
}

function Dashboard() {
  const { issues, projects } = useStore();
  const [tab, setTab] = useState("All Issues");
  const open = issues.filter(i => i.status === "Open").length;
  const progress = issues.filter(i => i.status === "In Progress").length;
  const resolved = issues.filter(i => i.status === "Resolved").length;
  const closed = issues.filter(i => i.status === "Closed").length;
  const recent = [...issues].sort((a,b) => b.id.localeCompare(a.id)).slice(0, 5);
  const shown = recent.filter(i => tab === "All Issues" || (tab === "My Issues" ? i.reporter === "Satyendra Singh" : i.assignee === "Satyendra Singh"));
  return <>
    <PageHeading title="Dashboard" subtitle="Overview of your bug tracking activity" action={<Link className="btn btn-primary" to="/issues/new"><Plus size={17}/> Report New Issue</Link>}/>
    <div className="metrics-grid">
      <MetricCard title="Total Issues" value={issues.length} icon={Bug} tone="red" change="12%" />
      <MetricCard title="Open" value={open} icon={Clock3} tone="blue" change="5%" />
      <MetricCard title="In Progress" value={progress} icon={Activity} tone="yellow" change="8%" trend="down"/>
      <MetricCard title="Resolved" value={resolved} icon={CheckCircle2} tone="green" change="40%" />
      <MetricCard title="Closed" value={closed} icon={CircleX} tone="purple" change="0%" />
    </div>
    <div className="dashboard-grid">
      <section className="panel issue-panel">
        <div className="panel-toolbar"><div className="tabs">{["All Issues", "My Issues", "Assigned to Me"].map(t => <button key={t} onClick={() => setTab(t)} className={`tab ${tab === t ? "selected" : ""}`}>{t}{t === "All Issues" ? ` (${issues.length})` : ""}</button>)}</div><div className="toolbar-selects"><select aria-label="Project filter" onChange={e => {}}><option>All Projects</option>{projects.map(p => <option key={p.id}>{p.name}</option>)}</select><select aria-label="Status filter"><option>All Statuses</option><option>Open</option><option>In Progress</option><option>Resolved</option></select></div></div>
        <IssueTable issues={shown} compact/>
        <div className="panel-footer"><Link to="/issues" className="text-link">View all issues <ChevronRight size={15}/></Link><span>Showing {shown.length} recent issues</span></div>
      </section>
      <aside className="right-column">
        <section className="panel filter-panel"><h3><Filter size={17}/> Filters</h3><QuickFilter/></section>
        <section className="panel activity-panel"><h3><Clock3 size={17}/> Recent Activity</h3><ActivityItem color="blue" title="John Doe created a new issue" text="Login button not working" time={`${dateLabel(-5)} · 10:24 AM`}/><ActivityItem color="yellow" title="Alice Smith updated issue #002" text="Changed status to In Progress" time={`${dateLabel(-6)} · 04:15 PM`}/><ActivityItem color="purple" title="Robert Johnson commented on #003" text="Working on the fix, will update soon." time={`${dateLabel(-7)} · 01:32 PM`}/><ActivityItem color="green" title="Sarah Wilson resolved issue #004" text="Typo in settings page" time={`${dateLabel(-8)} · 11:20 AM`}/><ActivityItem color="purple" title="Mike Kumar closed issue #009" text="Error message not user friendly" time={`${dateLabel(-13)} · 03:45 PM`}/></section>
      </aside>
    </div>
  </>;
}
function QuickFilter() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [project, setProject] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const { projects } = useStore();
  const apply = () => {
    const q = new URLSearchParams();
    if(search) q.set("search", search); if(project) q.set("project", project); if(status) q.set("status", status); if(priority) q.set("priority", priority);
    navigate(`/issues?${q.toString()}`);
  };
  return <div className="filter-fields"><label>Search<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search issues..."/></label><label>Project<select value={project} onChange={e=>setProject(e.target.value)}><option value="">All Projects</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>Status<select value={status} onChange={e=>setStatus(e.target.value)}><option value="">All Statuses</option>{["Open","In Progress","Resolved","Closed"].map(s=><option key={s}>{s}</option>)}</select></label><label>Priority<select value={priority} onChange={e=>setPriority(e.target.value)}><option value="">All Priorities</option>{["High","Medium","Low"].map(s=><option key={s}>{s}</option>)}</select></label><div className="filter-actions"><Button variant="outline" onClick={()=>{setSearch("");setProject("");setStatus("");setPriority("");}}>Reset</Button><Button onClick={apply}>Apply</Button></div></div>;
}

function IssueTable({ issues, compact = false, onDelete }) {
  const { projects } = useStore();
  if (!issues.length) return <EmptyState title="No issues found" text="Try adjusting your filters or create a new issue." action={<Link to="/issues/new" className="btn btn-primary"><Plus size={16}/> Create issue</Link>}/>;
  return <div className="table-scroll"><table className="data-table"><thead><tr><th>ID</th><th>Title</th><th>Project</th><th>Priority</th><th>Status</th><th>Assignee</th><th>Created</th><th></th></tr></thead><tbody>{issues.map(issue => <tr key={issue.id}><td><Link className="issue-id" to={`/issues/${issue.id}`}>{issue.id}</Link></td><td className="title-cell"><Link to={`/issues/${issue.id}`} className="issue-title">{issue.title}</Link><small>{issue.description}</small></td><td>{projects.find(p=>p.id===issue.projectId)?.name || "Unassigned"}</td><td><PriorityBadge priority={issue.priority}/></td><td><StatusBadge status={issue.status}/></td><td><span className="assignee"><Avatar name={issue.assignee} size="small"/><span>{issue.assignee}</span></span></td><td className="date-cell">{issue.created}</td><td><div className="row-actions"><Link to={`/issues/${issue.id}`} aria-label="View issue"><Eye size={16}/></Link><Link to={`/issues/${issue.id}/edit`} aria-label="Edit issue"><Pencil size={15}/></Link>{onDelete && <button aria-label="Delete issue" onClick={()=>onDelete(issue.id)}><Trash2 size={15}/></button>}</div></td></tr>)}</tbody></table></div>;
}

function IssuesPage() {
  const { issues, setIssues, projects } = useStore();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const [search, setSearch] = useState(params.get("search") || "");
  const [project, setProject] = useState(params.get("project") || "");
  const [status, setStatus] = useState(params.get("status") || "");
  const [priority, setPriority] = useState(params.get("priority") || "");
  const [sort, setSort] = useState("newest");
  const [showFilters, setShowFilters] = useState(true);
  useEffect(()=>{setSearch(params.get("search") || "");setProject(params.get("project") || "");setStatus(params.get("status") || "");setPriority(params.get("priority") || "");},[location.search]);
  const filtered = useMemo(() => {
    const arr = issues.filter(i => (!search || `${i.id} ${i.title} ${i.description}`.toLowerCase().includes(search.toLowerCase())) && (!project || i.projectId === project) && (!status || i.status === status) && (!priority || i.priority === priority));
    return arr.sort((a,b) => sort === "oldest" ? a.created.localeCompare(b.created) : b.id.localeCompare(a.id));
  }, [issues, search, project, status, priority, sort]);
  const remove = async id => { if(window.confirm(`Delete ${id}? This cannot be undone.`)){const issue=issues.find(i=>i.id===id);try{await apiDelete(`/issues/${issue?.apiId || id}`);setIssues(prev=>prev.filter(i=>i.id!==id));}catch(e){window.alert(e.message);}} };
  const reset = () => { setSearch("");setProject("");setStatus("");setPriority(""); };
  return <><PageHeading title="Issues" subtitle={`Manage and track all issues across your projects · ${issues.length} total`} action={<Link className="btn btn-primary" to="/issues/new"><Plus size={17}/> Report New Issue</Link>}/>
    <section className="panel listing-panel"><div className="list-toolbar"><div className="search-field"><Search size={17}/><input placeholder="Search by ID, title, or keyword..." value={search} onChange={e=>setSearch(e.target.value)}/></div><Button variant="outline" icon={SlidersHorizontal} onClick={()=>setShowFilters(!showFilters)}>Filters</Button><label className="sort-select"><span>Sort:</span><select value={sort} onChange={e=>setSort(e.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label></div>
    {showFilters && <div className="expanded-filters"><label>Project<select value={project} onChange={e=>setProject(e.target.value)}><option value="">All projects</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>Status<select value={status} onChange={e=>setStatus(e.target.value)}><option value="">All statuses</option>{["Open","In Progress","Resolved","Closed"].map(s=><option key={s}>{s}</option>)}</select></label><label>Priority<select value={priority} onChange={e=>setPriority(e.target.value)}><option value="">All priorities</option>{["High","Medium","Low"].map(s=><option key={s}>{s}</option>)}</select></label><Button variant="ghost" onClick={reset}>Clear filters</Button></div>}
    <IssueTable issues={filtered} onDelete={remove}/><div className="panel-footer"><span>Showing {filtered.length} of {issues.length} issues</span><span className="pagination"><button disabled><ChevronLeft size={16}/></button><button className="current-page">1</button><button disabled>2</button><button disabled>3</button><button disabled><ChevronRight size={16}/></button></span></div></section></>;
}


function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name || "pasted-image.png", type: file.type || "application/octet-stream", size: file.size, dataUrl: reader.result });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function IssueAttachments({ attachments = [], onAdd, onRemove, onPaste, compact = false }) {
  const inputId = React.useId();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [serverUrls, setServerUrls] = useState({});
  useEffect(() => { let alive=true; const pending=(attachments||[]).filter(a=>a.serverAttachment&&a.id&&!serverUrls[a.id]); Promise.all(pending.map(async a=>{try{return [a.id,await downloadAttachment(a.id)]}catch{return [a.id,null]}})).then(items=>{if(alive)setServerUrls(prev=>({...prev,...Object.fromEntries(items.filter(([,url])=>url))}));}); return ()=>{alive=false;}; }, [attachments]);

  const addFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setMessage("");
    const tooLarge = files.find(file => file.size > 8 * 1024 * 1024);
    if (tooLarge) { setMessage("Each file must be 8 MB or smaller."); return; }
    try {
      setBusy(true);
      const converted = await Promise.all(files.map(fileToDataUrl));
      onAdd(converted);
    } catch { setMessage("Could not read one of the selected files."); }
    finally { setBusy(false); }
  };
  return <section className={`issue-attachments ${compact ? "compact" : ""}`}
    onDragOver={e => e.preventDefault()}
    onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
    onPaste={e => {
      const imageItems = Array.from(e.clipboardData?.items || []).filter(item => item.type.startsWith("image/"));
      if (imageItems.length) {
        e.preventDefault();
        const files = imageItems.map((item, i) => {
          const blob = item.getAsFile();
          return new File([blob], `pasted-screenshot-${Date.now()}-${i + 1}.png`, { type: blob.type || "image/png" });
        });
        addFiles(files);
        onPaste?.();
      }
    }}>
    <div className="attachment-heading"><div><h4><PaperclipIcon /> Attachments</h4><p>Drop files here, browse, or paste a screenshot with Ctrl+V.</p></div>
      <label className="btn btn-outline attachment-browse" htmlFor={inputId}>{busy ? "Adding…" : "Browse files"}</label>
      <input id={inputId} type="file" multiple hidden onChange={e => { addFiles(e.target.files); e.target.value = ""; }} />
    </div>
    <div className="attachment-dropzone"><UploadIcon /><span>Drag and drop files here or paste an image</span><small>Images, PDFs, logs and other files · 8 MB per file</small></div>
    {message && <p className="attachment-error">{message}</p>}
    {attachments.length > 0 && <div className="attachment-list">{attachments.map((file, index) => <div className="attachment-item" key={`${file.name}-${index}`}>
      {file.type?.startsWith("image/") && (file.dataUrl || serverUrls[file.id]) ? <a href={file.dataUrl || serverUrls[file.id]} target="_blank" rel="noreferrer" className="attachment-thumb"><img src={file.dataUrl || serverUrls[file.id]} alt={file.name}/></a> : <span className="attachment-file-icon"><FileBarChart size={18}/></span>}
      <div className="attachment-file-meta"><b title={file.name}>{file.name}</b><small>{file.size < 1024 * 1024 ? `${Math.max(1, Math.round(file.size / 1024))} KB` : `${(file.size / 1024 / 1024).toFixed(1)} MB`}</small></div>
      {(file.dataUrl || serverUrls[file.id]) && <a className="attachment-download" href={file.dataUrl || serverUrls[file.id]} download={file.name} aria-label={`Download ${file.name}`}><Download size={15}/></a>}
      <button type="button" className="attachment-remove" onClick={() => onRemove(index)} aria-label={`Remove ${file.name}`}><X size={15}/></button>
    </div>)}</div>}
  </section>;
}
function PaperclipIcon() { return <span className="attachment-title-icon">📎</span>; }
function UploadIcon() { return <span className="attachment-upload-icon">↑</span>; }

function IssueFormPage() {
  const { id } = useParams();
  const { issues, setIssues, projects, users } = useStore();
  const existing = issues.find(i=>i.id===id);
  const navigate = useNavigate();
  const [form, setForm] = useState(existing || { title:"", description:"", projectId:projects[0]?.id || "", priority:"Medium", status:"Open", assignee:users.find(u=>u.role!=="Admin")?.name || "", reporter:"Satyendra Singh", due:"", type:"Bug", comments:[], attachments:[] });
  const [error, setError] = useState("");
  useEffect(()=>{if(existing) setForm(existing);},[id]);
  const change = e => setForm({...form,[e.target.name]:e.target.value});
  const addAttachments = files => setForm(prev=>({...prev, attachments:[...(prev.attachments||[]), ...files]}));
  const removeAttachment = index => setForm(prev=>({...prev, attachments:(prev.attachments||[]).filter((_,i)=>i!==index)}));
  const submit = async e => {
    e.preventDefault(); setError("");
    if(!form.title.trim()) { setError("Please enter an issue title."); return; }
    if(!form.projectId) { setError("Please select a project."); return; }
    try {
      const payload = { title:form.title.trim(), description:form.description?.trim() || "No description provided.", projectId:form.projectId, type:labelToEnum(form.type || "Bug"), status:labelToEnum(form.status || "Open"), priority:labelToEnum(form.priority || "Medium"), assigneeId:users.find(u=>u.name===form.assignee)?.id || null, dueDate:form.due ? new Date(`${form.due}T00:00:00.000Z`).toISOString() : null };
      const saved = existing ? await apiPatch(`/issues/${existing.apiId || existing.id}`, payload) : await apiPost("/issues", payload);
      const mapped = mapIssue(saved);
      if (existing) {
        const removed = (existing.attachments || []).filter(a => a.serverAttachment && !(form.attachments || []).some(next => next.id === a.id));
        for (const attachment of removed) await apiDelete(`/attachments/${attachment.id}`);
      }
      const pending = (form.attachments || []).filter(a=>a.dataUrl && !a.serverAttachment);
      for (const item of pending) {
        const blob = await (await fetch(item.dataUrl)).blob(); const file = new File([blob], item.name, {type:item.type || blob.type || "application/octet-stream"});
        const fd = new FormData(); fd.append("file", file); await api(`/attachments/issue/${saved.id}`, {method:"POST",body:fd});
      }
      const refreshed = mapIssue(await api(`/issues/${saved.key || saved.id}`));
      setIssues(prev=>existing?prev.map(i=>i.id===id?refreshed:i):[refreshed,...prev.filter(i=>i.id!==refreshed.id)]);
      navigate(`/issues/${refreshed.id}`, {replace:true});
    } catch(err) { setError(err.message || "Could not save the issue."); }
  };
  return <><PageHeading title={existing ? `Edit ${id}` : "Report New Issue"} subtitle={existing ? "Update the details and status of this issue." : "Describe the issue so your team can investigate and fix it."} back={()=>navigate(existing?`/issues/${id}`:"/issues")}/><form className="panel form-panel" onSubmit={submit}><div className="form-section"><h3>Issue details</h3><p>Provide a clear title and enough information to reproduce the issue.</p>{error && <div className="form-error"><AlertCircle size={16}/>{error}</div>}<label className="form-label">Issue title <span>*</span><input name="title" value={form.title} onChange={change} placeholder="e.g. Login button not working" autoFocus/></label><label className="form-label">Description<textarea name="description" value={form.description} onChange={change} rows="5" placeholder="What happened? What did you expect to happen? Steps to reproduce..."/></label><IssueAttachments attachments={form.attachments||[]} onAdd={addAttachments} onRemove={removeAttachment}/><div className="form-grid"><label className="form-label">Project <span>*</span><select name="projectId" value={form.projectId} onChange={change}>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label className="form-label">Issue type<select name="type" value={form.type} onChange={change}>{["Bug","Task","Feature","Improvement"].map(v=><option key={v}>{v}</option>)}</select></label><label className="form-label">Priority<select name="priority" value={form.priority} onChange={change}>{["High","Medium","Low"].map(v=><option key={v}>{v}</option>)}</select></label><label className="form-label">Status<select name="status" value={form.status} onChange={change}>{["Open","In Progress","Resolved","Closed"].map(v=><option key={v}>{v}</option>)}</select></label><label className="form-label">Assignee<select name="assignee" value={form.assignee} onChange={change}><option value="">Unassigned</option>{users.map(u=><option key={u.id} value={u.name}>{u.name}</option>)}</select></label><label className="form-label">Due date<input name="due" type="date" value={form.due || ""} onChange={change}/></label></div></div><div className="form-footer"><Button variant="outline" onClick={()=>navigate(existing?`/issues/${id}`:"/issues")}>Cancel</Button><Button type="submit" icon={Check}>{existing?"Save changes":"Create issue"}</Button></div></form></>;
}

function IssueDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { issues, setIssues, projects } = useStore();
  const issue = issues.find(i=>i.id===id);
  const [comment,setComment] = useState("");
  useEffect(() => { let alive=true; api(`/issues/${id}`).then(data=>{if(alive){const full=mapIssue(data);setIssues(prev=>prev.map(item=>item.id===id?full:item));}}).catch(err=>{if(alive) console.error("Could not load issue details:",err.message);}); return ()=>{alive=false;}; }, [id]);
  if(!issue) return <><PageHeading title="Issue not found" subtitle={`No issue was found with ID ${id}.`} back={()=>navigate("/issues")}/><EmptyState title="This issue may have been deleted" text="Return to the issues list to choose another issue." action={<Link to="/issues" className="btn btn-primary">Back to issues</Link>}/></>;
  const project = projects.find(p=>p.id===issue.projectId);
  const update = async patch => {
    try {
      if (patch.status || patch.priority) await apiPatch(`/issues/${issue.apiId || issue.id}`, { ...(patch.status ? {status:labelToEnum(patch.status)}:{}), ...(patch.priority ? {priority:labelToEnum(patch.priority)}:{}) });
      if (patch.attachments) {
        const next=patch.attachments; const removed=(issue.attachments||[]).filter(a=>a.serverAttachment&&!next.some(n=>n.id===a.id));
        for(const a of removed) await apiDelete(`/attachments/${a.id}`);
        const added=next.filter(a=>a.dataUrl&&!a.serverAttachment);
        for(const item of added){const blob=await(await fetch(item.dataUrl)).blob();const file=new File([blob],item.name,{type:item.type||blob.type});const fd=new FormData();fd.append("file",file);await api(`/attachments/issue/${issue.apiId || issue.id}`,{method:"POST",body:fd});}
        const data=await api(`/issues/${issue.apiId || issue.id}`); patch={...patch,attachments:(data.attachments||[]).map(a=>({...a,name:a.originalName,type:a.mimeType,serverAttachment:true,dataUrl:null}))};
      }
      setIssues(prev=>prev.map(i=>i.id===id?{...i,...patch}:i));
    } catch(e) { window.alert(e.message); }
  };
  const addComment = async e => {e.preventDefault();if(!comment.trim())return;try{await apiPost(`/issues/${issue.apiId || issue.id}/comments`,{body:comment.trim()});const fresh=mapIssue(await api(`/issues/${issue.apiId || issue.id}`));setIssues(prev=>prev.map(i=>i.id===id?fresh:i));setComment("");}catch(err){window.alert(err.message);}};
  return <><PageHeading title={issue.title} subtitle={<><Link to="/issues">Issues</Link> / {issue.id}</>} back={()=>navigate("/issues")} action={<><Button variant="outline" icon={Pencil} onClick={()=>navigate(`/issues/${id}/edit`)}>Edit issue</Button><Button icon={Plus} onClick={()=>navigate("/issues/new")}>New issue</Button></>}/><div className="detail-layout"><div className="detail-main"><section className="panel detail-card"><div className="detail-id-row"><span className="issue-id-large">{issue.id}</span><StatusBadge status={issue.status}/><PriorityBadge priority={issue.priority}/></div><h2>{issue.title}</h2><div className="detail-meta"><span><FolderKanban size={15}/>{project?.name || "Unassigned"}</span><span><CalendarDays size={15}/>Created {issue.created}</span><span><UserRound size={15}/>Reported by {issue.reporter}</span></div><div className="detail-description"><h3>Description</h3><p>{issue.description || "No description provided."}</p></div><IssueAttachments attachments={issue.attachments||[]} onAdd={files=>update({attachments:[...(issue.attachments||[]),...files]})} onRemove={index=>update({attachments:(issue.attachments||[]).filter((_,i)=>i!==index)})} compact/><div className="detail-actions"><label>Update status<select value={issue.status} onChange={e=>update({status:e.target.value})}>{["Open","In Progress","Resolved","Closed"].map(s=><option key={s}>{s}</option>)}</select></label><label>Priority<select value={issue.priority} onChange={e=>update({priority:e.target.value})}>{["High","Medium","Low"].map(s=><option key={s}>{s}</option>)}</select></label></div></section><section className="panel comments-panel"><h3>Comments <span className="count-bubble">{issue.comments?.length || 0}</span></h3><form className="comment-form" onSubmit={addComment}><Avatar name="Satyendra Singh"/><div><textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="Add a comment..." rows="3"/><div className="comment-actions"><span>Be clear and respectful.</span><Button type="submit" icon={Plus}>Add comment</Button></div></div></form>{issue.comments?.length ? issue.comments.map((c,i)=><div className="comment-item" key={i}><Avatar name={c.author}/><div><b>{c.author}</b><small>{c.time}</small><p>{c.text}</p></div></div>) : <p className="muted empty-comments">No comments yet. Start the conversation.</p>}</section></div><aside className="detail-side"><section className="panel properties-panel"><h3>Details</h3><Property label="Status"><StatusBadge status={issue.status}/></Property><Property label="Priority"><PriorityBadge priority={issue.priority}/></Property><Property label="Assignee"><span className="assignee"><Avatar name={issue.assignee || "Unassigned"} size="small"/>{issue.assignee || "Unassigned"}</span></Property><Property label="Issue type">{issue.type}</Property><Property label="Due date">{issue.due || "Not set"}</Property><Property label="Reporter">{issue.reporter}</Property></section><section className="panel properties-panel"><h3>Project</h3><div className="project-mini"><span className="project-mini-icon" style={{background:project?.color || "#2875ed"}}><FolderKanban size={19}/></span><div><b>{project?.name || "Unassigned"}</b><small>{project?.key || "—"}</small></div></div>{project && <Link className="text-link" to={`/projects/${project.id}`}>View project <ChevronRight size={15}/></Link>}</section></aside></div></>;
}
function Property({label,children}) {return <div className="property"><span>{label}</span><div>{children}</div></div>}

function ProjectsPage() {
  const { projects, setProjects, issues } = useStore();
  const [query,setQuery] = useState("");
  const [modal,setModal] = useState(false);
  const [form,setForm] = useState({name:"",key:"",description:"",lead:"Satyendra Singh",status:"Active",color:"#2875ed",due:""});
  const [error,setError] = useState("");
  const visible = projects.filter(p=>`${p.name} ${p.key} ${p.description}`.toLowerCase().includes(query.toLowerCase()));
  const create = async e => {e.preventDefault();if(!form.name.trim()){setError("Project name is required.");return;}try{const payload={name:form.name.trim(),key:form.key.trim().toUpperCase()||form.name.trim().replace(/[^A-Za-z0-9]/g,"").slice(0,3).toUpperCase(),description:form.description,status:labelToEnum(form.status||"Active"),color:form.color,dueDate:form.due?new Date(`${form.due}T00:00:00.000Z`).toISOString():null};const item=mapProject(await apiPost("/projects",payload));setProjects(prev=>[item,...prev]);setModal(false);setForm({name:"",key:"",description:"",lead:"",status:"Active",color:"#2875ed",due:""});setError("");}catch(err){setError(err.message);}};
  return <><PageHeading title="Projects" subtitle="Organize issues and collaborate across your projects." action={<Button icon={Plus} onClick={()=>setModal(true)}>New project</Button>}/><div className="list-toolbar standalone-toolbar"><div className="search-field"><Search size={17}/><input placeholder="Search projects..." value={query} onChange={e=>setQuery(e.target.value)}/></div><span className="muted">{visible.length} projects</span></div>{visible.length ? <div className="projects-grid">{visible.map(p=>{const items=issues.filter(i=>i.projectId===p.id);const done=items.filter(i=>["Resolved","Closed"].includes(i.status)).length;const percent=items.length?Math.round(done/items.length*100):0;return <article className="panel project-card" key={p.id}><div className="project-card-top"><span className="project-card-icon" style={{background:p.color}}><FolderKanban size={21}/></span><span className="project-status"><i/> {p.status}</span><Link to={`/projects/${p.id}`} className="more-link" aria-label="Open project"><MoreHorizontal size={19}/></Link></div><Link to={`/projects/${p.id}`} className="project-card-title">{p.name}</Link><p>{p.description || "No project description provided."}</p><div className="project-card-meta"><span>{p.key}</span><span><Users size={14}/>{new Set(items.map(i=>i.assignee).filter(Boolean)).size} contributors</span></div><div className="progress-head"><span>Issue completion</span><b>{percent}%</b></div><div className="progress-track"><span style={{width:`${percent}%`,background:p.color}}/></div><div className="project-card-footer"><span><Bug size={15}/>{items.length} issues</span><span><CalendarDays size={14}/>{p.due || "No due date"}</span><Avatar name={p.lead} size="small"/></div></article>;})}</div> : <EmptyState icon={FolderKanban} title="No projects found" text="Try another search or create a project." action={<Button onClick={()=>setModal(true)} icon={Plus}>New project</Button>}/>}
  {modal && <Modal title="Create project" onClose={()=>setModal(false)}><form onSubmit={create} className="modal-form">{error&&<div className="form-error">{error}</div>}<label className="form-label">Project name <span>*</span><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Customer Portal"/></label><label className="form-label">Project key<input value={form.key} onChange={e=>setForm({...form,key:e.target.value})} placeholder="e.g. WEB"/></label><label className="form-label">Description<textarea rows="3" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="What is this project about?"/></label><label className="form-label">Project lead<input value={form.lead} onChange={e=>setForm({...form,lead:e.target.value})}/></label><div className="modal-actions"><Button variant="outline" onClick={()=>setModal(false)}>Cancel</Button><Button type="submit">Create project</Button></div></form></Modal>}</>;
}

function ProjectDetailPage() {
  const {id} = useParams(); const {projects,issues,setIssues} = useStore(); const navigate=useNavigate();
  const project=projects.find(p=>p.id===id); const projectIssues=issues.filter(i=>i.projectId===id);
  if(!project)return <><PageHeading title="Project not found" back={()=>navigate("/projects")}/><EmptyState title="Project not found" text="This project may have been removed."/></>;
  const updateStatus=async(issueId,status)=>{const item=issues.find(i=>i.id===issueId);try{await apiPatch(`/issues/${item?.apiId || issueId}`,{status:labelToEnum(status)});setIssues(prev=>prev.map(i=>i.id===issueId?{...i,status}:i));}catch(err){window.alert(err.message);}};
  return <><PageHeading title={project.name} subtitle={`${project.key} · Project overview`} back={()=>navigate("/projects")} action={<Link className="btn btn-primary" to="/issues/new"><Plus size={16}/> Add issue</Link>}/><div className="project-detail-banner panel"><span className="project-card-icon" style={{background:project.color}}><FolderKanban size={23}/></span><div className="project-banner-copy"><h2>{project.name}</h2><p>{project.description}</p><div className="detail-meta"><span><UserRound size={15}/>Lead: {project.lead}</span><span><CalendarDays size={15}/>Due: {project.due || "Not set"}</span><StatusBadge status={project.status}/></div></div></div><div className="metrics-grid project-metrics"><MetricCard title="Total issues" value={projectIssues.length} icon={Bug} tone="blue" change="—" detail="in this project"/><MetricCard title="Open" value={projectIssues.filter(i=>i.status==="Open").length} icon={Clock3} tone="yellow" change="—" detail="need attention"/><MetricCard title="In progress" value={projectIssues.filter(i=>i.status==="In Progress").length} icon={Activity} tone="purple" change="—" detail="being worked on"/><MetricCard title="Resolved" value={projectIssues.filter(i=>["Resolved","Closed"].includes(i.status)).length} icon={CheckCircle2} tone="green" change="—" detail="completed"/></div><section className="panel listing-panel"><div className="section-title-row"><div><h2>Project issues</h2><p>All issues assigned to {project.name}</p></div><Link to="/issues" className="text-link">View all issues <ChevronRight size={15}/></Link></div><IssueTable issues={projectIssues}/></section></>;
}

function UsersPage() {
  const {users,setUsers} = useStore(); const [query,setQuery]=useState(""); const [modal,setModal]=useState(false); const [form,setForm]=useState({name:"",email:"",password:"",role:"Developer",status:"Active"}); const [error,setError]=useState("");
  const visible=users.filter(u=>`${u.name} ${u.email} ${u.role}`.toLowerCase().includes(query.toLowerCase()));
  const add=async e=>{e.preventDefault();if(!form.name.trim()||!form.email.trim()||!form.password){setError("Name, email, and initial password are required.");return;}if(form.password.length<8){setError("Password must be at least 8 characters.");return;}try{const created=await apiPost("/users",{name:form.name.trim(),email:form.email.trim(),password:form.password,role:labelToEnum(form.role),status:labelToEnum(form.status)});setUsers(prev=>[mapUser(created),...prev]);setModal(false);setForm({name:"",email:"",password:"",role:"Developer",status:"Active"});setError("");}catch(err){setError(err.message);}};
  return <><PageHeading title="Users" subtitle="Manage workspace members, roles, and access." action={<Button icon={Plus} onClick={()=>setModal(true)}>Invite user</Button>}/><div className="user-stats"><div className="panel user-stat"><Users size={20}/><span>Total members</span><b>{users.length}</b></div><div className="panel user-stat"><CheckCircle2 size={20}/><span>Active</span><b>{users.filter(u=>u.status==="Active").length}</b></div><div className="panel user-stat"><Clock3 size={20}/><span>Pending invites</span><b>{users.filter(u=>u.status==="Invited").length}</b></div></div><section className="panel listing-panel"><div className="list-toolbar"><div className="search-field"><Search size={17}/><input placeholder="Search members..." value={query} onChange={e=>setQuery(e.target.value)}/></div><span className="muted">{visible.length} members</span></div><div className="table-scroll"><table className="data-table users-table"><thead><tr><th>Member</th><th>Role</th><th>Status</th><th>Date added</th><th>Actions</th></tr></thead><tbody>{visible.map(u=><tr key={u.id}><td><span className="user-table-cell"><Avatar name={u.name}/><span><b>{u.name}</b><small>{u.email}</small></span></span></td><td><select className="inline-select" value={u.role} onChange={async e=>{try{const updated=await apiPatch(`/users/${u.id}`,{role:labelToEnum(e.target.value)});setUsers(prev=>prev.map(x=>x.id===u.id?mapUser(updated):x));}catch(err){window.alert(err.message);}}}>{["Admin","Project Manager","Developer","QA Engineer","Reporter"].map(r=><option key={r}>{r}</option>)}</select></td><td><StatusBadge status={u.status}/></td><td>{u.joined}</td><td><div className="row-actions"><button title="Toggle active status" onClick={async()=>{try{const updated=await apiPatch(`/users/${u.id}`,{status:labelToEnum(u.status==="Active"?"Disabled":"Active")});setUsers(prev=>prev.map(x=>x.id===u.id?mapUser(updated):x));}catch(err){window.alert(err.message);}}}><ShieldCheck size={16}/></button><button title="Remove user" onClick={()=>{if(window.confirm(`Disable ${u.name} in this workspace?`))apiDelete(`/users/${u.id}`).then(()=>setUsers(prev=>prev.filter(x=>x.id!==u.id))).catch(err=>window.alert(err.message));}}><Trash2 size={15}/></button></div></td></tr>)}</tbody></table></div><div className="panel-footer"><span>Showing {visible.length} of {users.length} members</span></div></section>
  {modal&&<Modal title="Invite a user" onClose={()=>setModal(false)}><form className="modal-form" onSubmit={add}>{error&&<div className="form-error">{error}</div>}<label className="form-label">Full name <span>*</span><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Jane Smith"/></label><label className="form-label">Email address <span>*</span><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="jane@company.com"/></label><label className="form-label">Initial password <span>*</span><input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} minLength={8} placeholder="At least 8 characters"/></label><label className="form-label">Role<select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>{["Project Manager","Developer","QA Engineer","Viewer","Admin"].map(r=><option key={r}>{r}</option>)}</select></label><div className="modal-note"><Bell size={16}/> User management is connected to the BugTracker API.</div><div className="modal-actions"><Button variant="outline" onClick={()=>setModal(false)}>Cancel</Button><Button type="submit">Add member</Button></div></form></Modal>}</>;
}

function ReportsPage() {
  const {issues,projects}=useStore();
  const statuses=["Open","In Progress","Resolved","Closed"];
  const priorities=["High","Medium","Low"];
  const maxStatus=Math.max(1,...statuses.map(s=>issues.filter(i=>i.status===s).length));
  const maxPriority=Math.max(1,...priorities.map(s=>issues.filter(i=>i.priority===s).length));
  const total=issues.length; const resolved=issues.filter(i=>["Resolved","Closed"].includes(i.status)).length;
  const exportCsv=()=>{const rows=[["ID","Title","Project","Priority","Status","Assignee","Created"],...issues.map(i=>[i.id,i.title,projects.find(p=>p.id===i.projectId)?.name||"",i.priority,i.status,i.assignee,i.created])];const csv=rows.map(r=>r.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(",")).join("\n");const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="bugtracker-issues-report.csv";a.click();URL.revokeObjectURL(url);};
  return <><PageHeading title="Reports" subtitle="Understand issue trends and project health." action={<Button variant="outline" icon={Download} onClick={exportCsv}>Export CSV</Button>}/><div className="metrics-grid report-metrics"><MetricCard title="Total issues" value={total} icon={Bug} tone="blue" change="All time" detail="tracked"/><MetricCard title="Resolution rate" value={`${total?Math.round(resolved/total*100):0}%`} icon={Gauge} tone="green" change={`${resolved} issues`} detail="resolved or closed"/><MetricCard title="High priority" value={issues.filter(i=>i.priority==="High").length} icon={AlertCircle} tone="red" change="Needs attention" detail="high priority"/><MetricCard title="Active projects" value={projects.filter(p=>p.status==="Active").length} icon={FolderKanban} tone="purple" change="Current" detail="projects"/></div><div className="reports-grid"><section className="panel report-card"><div className="section-title-row"><div><h2>Issues by status</h2><p>Current distribution of tracked issues</p></div><ListFilter size={18}/></div><div className="bar-chart">{statuses.map((s,i)=>{const count=issues.filter(x=>x.status===s).length;return <div className="bar-row" key={s}><span>{s}</span><div className="bar-track"><div className={`bar-fill bar-${i}`} style={{width:`${count/maxStatus*100}%`}}/></div><b>{count}</b></div>;})}</div></section><section className="panel report-card"><div className="section-title-row"><div><h2>Issues by priority</h2><p>Where the team should focus</p></div><Zap size={18}/></div><div className="priority-report">{priorities.map(p=>{const count=issues.filter(x=>x.priority===p).length;return <div key={p} className="priority-report-row"><div><PriorityBadge priority={p}/><span>{count} issues</span></div><div className="bar-track"><div className={`bar-fill priority-fill-${p.toLowerCase()}`} style={{width:`${count/maxPriority*100}%`}}/></div></div>;})}</div></section></div><section className="panel listing-panel report-project-table"><div className="section-title-row"><div><h2>Project health</h2><p>Issue progress across all projects</p></div></div><div className="table-scroll"><table className="data-table"><thead><tr><th>Project</th><th>Total issues</th><th>Open</th><th>In progress</th><th>Resolved</th><th>Completion</th></tr></thead><tbody>{projects.map(p=>{const arr=issues.filter(i=>i.projectId===p.id);const done=arr.filter(i=>["Resolved","Closed"].includes(i.status)).length;return <tr key={p.id}><td><Link to={`/projects/${p.id}`} className="project-table-name"><span style={{background:p.color}}/><b>{p.name}</b></Link></td><td>{arr.length}</td><td>{arr.filter(i=>i.status==="Open").length}</td><td>{arr.filter(i=>i.status==="In Progress").length}</td><td>{done}</td><td><div className="table-progress"><div className="progress-track"><span style={{width:`${arr.length?done/arr.length*100:0}%`,background:p.color}}/></div><b>{arr.length?Math.round(done/arr.length*100):0}%</b></div></td></tr>;})}</tbody></table></div></section></>;
}

function SettingsPage() {
  const {user,setUser,settings,setSettings}=useStore();
  const [profile,setProfile]=useState({name:user.name,email:user.email});
  const [saved,setSaved]=useState("");
  const saveProfile=async e=>{e.preventDefault();try{const updated=await apiPatch("/auth/me",{name:profile.name,email:profile.email});const next={...user,...updated,role:enumToLabel(updated.role)};setUser(next);localStorage.setItem("bt_user",JSON.stringify(next));setSaved("Profile changes saved.");}catch(err){setSaved(err.message);}setTimeout(()=>setSaved(""),3000);};
  const toggle=async(key)=>{const next={...settings,[key]:!settings[key]};try{const saved=await apiPatch("/settings",{[key]:next[key]});setSettings(prev=>({...prev,...saved}));}catch(err){window.alert(err.message);}};
  return <><PageHeading title="Settings" subtitle="Manage your account, preferences, and workspace."/>{saved&&<div className="success-banner"><CheckCircle2 size={17}/>{saved}</div>}<div className="settings-layout"><nav className="panel settings-nav"><a href="#profile" className="settings-nav-item selected"><UserRound size={17}/> Profile</a><a href="#preferences" className="settings-nav-item"><SlidersHorizontal size={17}/> Preferences</a><a href="#notifications" className="settings-nav-item"><Bell size={17}/> Notifications</a><a href="#workspace" className="settings-nav-item"><ShieldCheck size={17}/> Workspace</a></nav><div className="settings-content"><section className="panel settings-card" id="profile"><div className="settings-card-heading"><div><h2>Profile information</h2><p>Update your personal details and account information.</p></div><Avatar name={profile.name} size="large"/></div><form onSubmit={saveProfile}><label className="form-label">Full name<input value={profile.name} onChange={e=>setProfile({...profile,name:e.target.value})}/></label><label className="form-label">Email address<input type="email" value={profile.email} onChange={e=>setProfile({...profile,email:e.target.value})}/></label><label className="form-label">Role<input value={user.role} disabled/></label><div className="settings-card-footer"><span className="muted">Changes are saved to your BugTracker account.</span><Button type="submit">Save changes</Button></div></form></section><section className="panel settings-card" id="preferences"><h2>Preferences</h2><p>Customize your workspace experience.</p><label className="form-label">Workspace name<input value={settings.workspace} onChange={e=>setSettings({...settings,workspace:e.target.value})} onBlur={async e=>{try{const saved=await apiPatch("/settings",{workspace:e.target.value});setSettings(prev=>({...prev,...saved}));}catch(err){window.alert(err.message);}}}/></label><ToggleRow title="Compact mode" description="Reduce spacing in tables and lists." checked={settings.compactMode} onChange={()=>toggle("compactMode")}/></section><section className="panel settings-card" id="notifications"><h2>Notifications</h2><p>Choose which updates you want to receive.</p><ToggleRow title="Email notifications" description="Receive email when issues are assigned or updated." checked={settings.emailNotifications} onChange={()=>toggle("emailNotifications")}/><ToggleRow title="Weekly summary" description="Get a weekly digest of project activity and issue trends." checked={settings.weeklySummary} onChange={()=>toggle("weeklySummary")}/></section><section className="panel settings-card" id="workspace"><h2>Workspace</h2><p>Workspace configuration and account actions.</p><div className="workspace-info"><span className="workspace-icon"><ShieldCheck size={20}/></span><div><b>{settings.workspace || "BugTracker"}</b><small>Connected to BugTracker API</small></div><span className="pill status-active">Active</span></div><Button variant="outline" icon={LogOut} onClick={async()=>{try{await apiPost("/auth/logout",{});}catch{}localStorage.removeItem("bt_access_token");localStorage.removeItem("bt_user");window.location.href="/login";}}>Sign out</Button></section></div></div></>;
}
function ToggleRow({title,description,checked,onChange}) {return <div className="toggle-row"><div><b>{title}</b><p>{description}</p></div><button type="button" role="switch" aria-checked={checked} onClick={onChange} className={`switch ${checked?"on":""}`}><span/></button></div>}

function Modal({title,onClose,children}) {useEffect(()=>{const fn=e=>{if(e.key==="Escape")onClose();};window.addEventListener("keydown",fn);return()=>window.removeEventListener("keydown",fn);},[onClose]);return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><section className="modal"><div className="modal-heading"><h2>{title}</h2><button className="icon-button" onClick={onClose}><X size={19}/></button></div>{children}</section></div>}
function NotFound() {return <div className="not-found"><span className="empty-icon"><CircleHelp size={27}/></span><h1>Page not found</h1><p>The page you're looking for doesn't exist.</p><Link to="/" className="btn btn-primary"><Home size={16}/> Back to dashboard</Link></div>}

function AuthPage({mode}) {
  const {user,setUser}=useStore(); const navigate=useNavigate();
  const [name,setName]=useState(""); const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [message,setMessage]=useState(""); const [error,setError]=useState(""); const [showPassword,setShowPassword]=useState(false);
  const isLogin=mode==="login", isRegister=mode==="register";
  const submit=async e=>{e.preventDefault();setError("");if(!email.trim()){setError("Enter your email address.");return;}if(mode!=="forgot"&&!password.trim()){setError("Enter your password.");return;}if(isRegister&&!name.trim()){setError("Enter your full name.");return;}if(isRegister&&password.length<8){setError("Use at least 8 characters for your password.");return;}if(mode==="forgot"){setError("Password reset is not configured on this API yet. Contact your administrator.");return;}try{const result=isRegister?await apiPost("/auth/register",{name:name.trim(),email:email.trim(),password}):await apiPost("/auth/login",{email:email.trim(),password});localStorage.setItem("bt_access_token",result.accessToken);const nextUser={...result.user,role:enumToLabel(result.user.role)};localStorage.setItem("bt_user",JSON.stringify(nextUser));setUser(nextUser);navigate("/",{replace:true});window.location.reload();}catch(err){setError(err.message || "Authentication failed.");}};
  return <div className="auth-layout"><div className="auth-art"><Link to="/login" className="brand auth-brand"><span className="brand-mark"><Bug size={25}/></span><span><b>BugTracker</b><small>Track · Manage · Fix</small></span></Link><div className="auth-art-content"><span className="auth-eyebrow"><Zap size={15}/> TEAM WORK, MADE CLEAR</span><h1>Find it.<br/>Track it.<br/><span>Fix it.</span></h1><p>One clear view of every issue, every project, and every fix your team ships.</p><div className="auth-feature-list"><span><CheckCircle2 size={17}/> Stay on top of every issue</span><span><CheckCircle2 size={17}/> Keep your team in sync</span><span><CheckCircle2 size={17}/> Ship better software, faster</span></div></div><div className="auth-art-footer">BugTracker · Issue management made simple</div></div><div className="auth-form-side"><div className="auth-form-wrap"><div className="auth-mobile-brand"><span className="brand-mark"><Bug size={22}/></span><b>BugTracker</b></div><div className="auth-heading"><h2>{isLogin?"Welcome back":isRegister?"Create your account":"Reset your password"}</h2><p>{isLogin?"Sign in to continue to your workspace":isRegister?"Start tracking issues with your team today":"Enter your email and we'll help you get back in"}</p></div>{error&&<div className="form-error"><AlertCircle size={16}/>{error}</div>}{message&&<div className="success-banner"><CheckCircle2 size={17}/>{message}</div>}<form className="auth-form" onSubmit={submit}>{isRegister&&<label className="form-label">Full name<input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" autoComplete="name"/></label>}<label className="form-label">Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com" autoComplete="email"/></label>{mode!=="forgot"&&<label className="form-label">Password<div className="password-wrap"><LockKeyhole size={16}/><input type={showPassword?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder={isRegister?"At least 8 characters":"Enter your password"} autoComplete={isLogin?"current-password":"new-password"}/><button type="button" onClick={()=>setShowPassword(!showPassword)}><Eye size={16}/></button></div></label>}{isLogin&&<div className="auth-options"><label className="remember-label"><input type="checkbox"/> Remember me</label><Link to="/forgot-password">Forgot password?</Link></div>}<Button type="submit" className="auth-submit">{isLogin?"Sign in":isRegister?"Create account":"Send reset instructions"} <ChevronRight size={17}/></Button></form><div className="auth-switch">{isLogin?<>Don't have an account? <Link to="/register">Create an account</Link></>:isRegister?<>Already have an account? <Link to="/login">Sign in</Link></>:<>Remembered your password? <Link to="/login">Back to sign in</Link></>}</div><div className="auth-disclaimer"><LockKeyhole size={13}/> Secure sign-in is handled by the BugTracker API.</div></div></div></div>;
}

export default App;
