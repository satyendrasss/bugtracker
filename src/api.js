const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1";
export class ApiError extends Error { constructor(message, status=0){super(message);this.status=status;} }
export async function api(path, options={}) {
  const token = localStorage.getItem("bt_access_token");
  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  let response;
  try { response = await fetch(`${API_BASE}${path}`, {...options, headers}); }
  catch { throw new ApiError(`Cannot connect to BugTracker API at ${API_BASE}. Start the backend and check VITE_API_URL.`); }
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : null;
  if (!response.ok) {
    if (response.status === 401 && !path.startsWith("/auth/")) {
      localStorage.removeItem("bt_access_token"); localStorage.removeItem("bt_user");
      if (window.location.pathname !== "/login") window.location.href = "/login";
    }
    throw new ApiError(payload?.message || payload?.error || `Request failed (${response.status})`, response.status);
  }
  return payload?.data ?? payload;
}
export const apiPost = (path, body) => api(path, {method:"POST", body:JSON.stringify(body)});
export const apiPatch = (path, body) => api(path, {method:"PATCH", body:JSON.stringify(body)});
export const apiDelete = path => api(path, {method:"DELETE"});
export const enumToLabel = value => ({OPEN:"Open",IN_PROGRESS:"In Progress",RESOLVED:"Resolved",CLOSED:"Closed",REOPENED:"Reopened",LOW:"Low",MEDIUM:"Medium",HIGH:"High",CRITICAL:"Critical",BUG:"Bug",TASK:"Task",IMPROVEMENT:"Improvement",FEATURE:"Feature",ACTIVE:"Active",ON_HOLD:"On Hold",COMPLETED:"Completed",ARCHIVED:"Archived",ADMIN:"Admin",PROJECT_MANAGER:"Project Manager",DEVELOPER:"Developer",QA_ENGINEER:"QA Engineer",REPORTER:"Reporter",INVITED:"Invited",DISABLED:"Disabled"}[value] || value || "");
export const labelToEnum = value => ({"Open":"OPEN","In Progress":"IN_PROGRESS","Resolved":"RESOLVED","Closed":"CLOSED","Reopened":"REOPENED","Low":"LOW","Medium":"MEDIUM","High":"HIGH","Critical":"CRITICAL","Bug":"BUG","Task":"TASK","Improvement":"IMPROVEMENT","Feature":"FEATURE","Active":"ACTIVE","On Hold":"ON_HOLD","Completed":"COMPLETED","Archived":"ARCHIVED","Admin":"ADMIN","Project Manager":"PROJECT_MANAGER","Developer":"DEVELOPER","QA Engineer":"QA_ENGINEER","Reporter":"REPORTER","Invited":"INVITED","Disabled":"DISABLED"}[value] || value);
export const dateOnly = value => value ? new Date(value).toISOString().slice(0,10) : "";
export const mapProject = p => ({...p, apiId:p.id, id:p.id, lead:p.lead?.name || "Unassigned", status:enumToLabel(p.status), due:dateOnly(p.dueDate), issues:p._count?.issues || 0});
export const mapUser = u => ({...u, id:u.id, role:enumToLabel(u.role), status:enumToLabel(u.status), joined:u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) : ""});
export const mapAttachment = a => ({...a, id:a.id, name:a.originalName, type:a.mimeType, size:a.size, serverAttachment:true, dataUrl:null});
export const mapIssue = i => ({...i, apiId:i.id, id:i.key || i.id, projectId:i.projectId, project:i.project?.name, priority:enumToLabel(i.priority), status:enumToLabel(i.status), type:enumToLabel(i.type), assignee:i.assignee?.name || "", assigneeId:i.assigneeId || "", reporter:i.reporter?.name || "", created:i.createdAt ? new Date(i.createdAt).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) : "", due:dateOnly(i.dueDate), comments:(i.comments||[]).map(c=>({id:c.id,author:c.author?.name || "User",text:c.body,time:new Date(c.createdAt).toLocaleString()})), attachments:(i.attachments||[]).map(mapAttachment)});

export async function downloadAttachment(id) {
  const token=localStorage.getItem("bt_access_token");
  const response=await fetch(`${API_BASE}/attachments/${id}/download`,{headers:token?{Authorization:`Bearer ${token}`}:{}});
  if(!response.ok){let message=`Download failed (${response.status})`;try{message=(await response.json()).message||message}catch{}throw new ApiError(message,response.status);}
  return URL.createObjectURL(await response.blob());
}
export async function fetchAll(path) {
  const separator = path.includes("?") ? "&" : "?";
  const first = await api(`${path}${separator}page=1&limit=100`);
  const items = [...(first.items || [])];
  const pages = first.pagination?.totalPages || 1;
  for (let page = 2; page <= pages; page++) {
    const result = await api(`${path}${separator}page=${page}&limit=100`);
    items.push(...(result.items || []));
  }
  return items;
}
