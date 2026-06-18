// ═══════════════════════════════════════════════════════
//  API client – axios with JWT interceptor + auto-refresh
// ═══════════════════════════════════════════════════════

import axios, { AxiosError } from 'axios'
import { getAccessToken, getRefreshToken, saveTokens, clearAuth, getStoredUser } from './auth'

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})

// Attach JWT access token to every request
api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 → attempt token refresh
let isRefreshing = false
let failQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = []

function processQueue(error: unknown, token: string | null = null) {
  failQueue.forEach(({ resolve, reject }) => (token ? resolve(token) : reject(error)))
  failQueue = []
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalReq = error.config as typeof error.config & { _retry?: boolean }
    if (error.response?.status === 401 && !originalReq._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) =>
          failQueue.push({
            resolve: (token) => {
              originalReq!.headers!.Authorization = `Bearer ${token}`
              resolve(api(originalReq!))
            },
            reject,
          })
        )
      }
      originalReq._retry = true
      isRefreshing = true
      const refreshToken = getRefreshToken()
      if (!refreshToken) { clearAuth(); window.location.href = '/'; return Promise.reject(error) }
      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken })
        const user = getStoredUser()!
        saveTokens(data.accessToken, data.refreshToken, { ...user, exp: data.exp })
        processQueue(null, data.accessToken)
        originalReq!.headers!.Authorization = `Bearer ${data.accessToken}`
        return api(originalReq!)
      } catch (err) {
        processQueue(err, null)
        clearAuth()
        window.location.href = '/'
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)

// ── Auth endpoints ──────────────────────────────────────
export const authApi = {
  register:           (data: RegisterPayload)           => api.post('/auth/register', data),
  registerResearcher: (data: ResearcherRegPayload)      => api.post('/auth/researcher-register', data),
  login:              (data: LoginPayload)               => api.post('/auth/login', data),
  logout:             ()                                 => api.post('/auth/logout'),
  verify:             ()                                 => api.get('/auth/verify'),
  forgotPassword:     (email: string)                   => api.post('/auth/forgot-password', { email }),
  resetPassword:      (email: string, code: string, newPassword: string) => api.post('/auth/reset-password', { email, code, newPassword }),
}

// ── Needs endpoints ─────────────────────────────────────
export const needsApi = {
  create:         (data: NeedPayload)    => api.post('/needs', data),
  getMyNeeds:     ()                     => api.get('/needs/company'),
  getAllNeeds:     ()                     => api.get('/needs/all'),
  updateStatus:   (id: string, status: string) => api.put(`/needs/${id}/status`, { status }),
}

// ── Services endpoints ──────────────────────────────────
export const servicesApi = {
  getAll:    ()               => api.get('/services'),
  publish:   (d: ServicePayload) => api.post('/services', d),
  remove:    (id: string)    => api.delete(`/services/${id}`),
}

// ── Profile endpoints ───────────────────────────────────
export const profileApi = {
  get:    ()                    => api.get('/profile/me'),
  update: (d: ProfilePayload)   => api.put('/profile/me', d),
  getCompanies: ()              => api.get('/profile/companies'),
  toggleCompany: (id: string)   => api.put(`/profile/companies/${id}/toggle`),
}

// ── Researchers endpoints ───────────────────────────────
export const researchersApi = {
  getAll:   ()                         => api.get('/researchers'),
  getAllAdmin: ()                       => api.get('/researchers/admin'),
  create:   (d: ResearcherPayload)     => api.post('/researchers', d),
  update:   (id: string, d: Partial<ResearcherPayload>) => api.put(`/researchers/${id}`, d),
  remove:   (id: string)               => api.delete(`/researchers/${id}`),
}

// ── Offers endpoints ────────────────────────────────────
export const offersApi = {
  getOpen:        ()                         => api.get('/offers'),
  getAll:         ()                         => api.get('/offers/all'),
  create:         (d: OfferPayload)          => api.post('/offers', d),
  update:         (id: string, d: Partial<OfferPayload>) => api.put(`/offers/${id}`, d),
  remove:         (id: string)               => api.delete(`/offers/${id}`),
  apply:          (id: string, coverLetter: string) => api.post(`/offers/${id}/apply`, { coverLetter }),
  getMyApplications: ()                      => api.get('/offers/my/applications'),
  getOfferApplications: (id: string)         => api.get(`/offers/${id}/applications`),
  getAllApplications: ()                      => api.get('/offers/admin/applications'),
  updateAppStatus: (id: string, status: string) => api.put(`/offers/applications/${id}/status`, { status }),
}

// ── Projects endpoints ──────────────────────────────────
export const projectsApi = {
  getAll:           ()                           => api.get('/projects/all'),
  getMy:            ()                           => api.get('/projects/company'),
  getResearcher:    ()                           => api.get('/projects/my'),
  get:              (id: string)                 => api.get(`/projects/${id}`),
  create:           (d: ProjectPayload)          => api.post('/projects', d),
  update:           (id: string, d: Partial<ProjectPayload>) => api.put(`/projects/${id}`, d),
  remove:           (id: string)                 => api.delete(`/projects/${id}`),
  assign:           (id: string, researcherId: string, role?: string) => api.post(`/projects/${id}/assign`, { researcherId, role }),
  respond:          (assignId: string, response: string, declineNote?: string) => api.put(`/projects/assignments/${assignId}/respond`, { response, declineNote }),
  getAssignments:   (id: string)                 => api.get(`/projects/${id}/assignments`),
  createContract:   (id: string, d: ContractPayload) => api.post(`/projects/${id}/contracts`, d),
  updateContract:   (id: string, contractId: string, status: string) => api.put(`/projects/${id}/contracts/${contractId}`, { status }),
  addDocument:      (id: string, d: DocumentPayload) => api.post(`/projects/${id}/documents`, d),
  getDocuments:     (id: string)                 => api.get(`/projects/${id}/documents`),
}

// ── Messages endpoints ──────────────────────────────────
export const messagesApi = {
  send:          (d: { projectId?: string; receiverId?: string; body: string }) => api.post('/messages', d),
  getProject:    (projectId: string) => api.get(`/messages/project/${projectId}`),
  getMy:         ()                  => api.get('/messages/me'),
  getUnread:     ()                  => api.get('/messages/unread'),
}

// ── Notifications endpoints ─────────────────────────────
export const notificationsApi = {
  getMy:      ()         => api.get('/notifications'),
  getUnread:  ()         => api.get('/notifications/unread'),
  markRead:   (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: ()        => api.put('/notifications/read-all'),
}

// ── Types ───────────────────────────────────────────────
export interface RegisterPayload {
  companyName: string
  sector: string
  contactName: string
  email: string
  phone: string
  password: string
}
export interface LoginPayload {
  email: string
  password: string
}
export interface NeedPayload {
  title: string
  serviceType: string
  description: string
  deadline: string
  budget: string
}
export interface ServicePayload {
  category: string
  title: string
  description: string
}
export interface ProfilePayload {
  companyName?: string; sector?: string; contactName?: string
  phone?: string; website?: string; address?: string; employees?: number; about?: string
}
export interface ResearcherPayload {
  fullName: string; specialty: string; department?: string; grade?: string
  email: string; phone?: string; bio?: string; expertise?: string[]
}
export interface OfferPayload {
  title: string; description: string; category: string
  deadline?: string; budget?: number; slots?: number; tags?: string[]
}
export interface ResearcherRegPayload {
  fullName: string; department?: string; specialty?: string
  grade?: string; email: string; phone?: string; password: string
}
export interface ProjectPayload {
  needId?: string; companyId: string; title: string; description?: string
  budgetApproved?: number; startDate?: string; endDate?: string
  status?: string; progress?: number; adminNotes?: string
}
export interface ContractPayload {
  title: string; notes?: string; expiresAt?: string
}
export interface DocumentPayload {
  title: string; fileName?: string; fileUrl?: string
  docType?: string; visibility?: string
}
