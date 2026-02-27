import React, { useState, useEffect, useRef } from 'react'
import { Dashboard } from './pages/Dashboard'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { Pricing } from './pages/Pricing'
import { Success } from './pages/Success'
import Settings from './pages/Settings'
import EditProfile from './pages/EditProfile'
import EditEntity from './pages/EditEntity'
import EditNotifications from './pages/EditNotifications'
import ResetPassword from './pages/ResetPassword'
import { ForgotPassword } from './pages/ForgotPassword'
import { Licenses } from './pages/Licenses'
import { AcceptInvitation } from './pages/AcceptInvitation'
import AddAccountant from './pages/AddAccountant'
import OtherSettings from './pages/OtherSettings'
import { Documents } from './pages/Documents'
import { Receipts } from './pages/Receipts'
import Chats from './pages/Chats'
import Messages from './pages/Messages'
import TodoList from './pages/TodoList'
import Entities from './pages/Entities'
import { Bookmarks } from './pages/Bookmarks'
import { Reports } from './pages/Reports'
import { BatchView } from './pages/BatchView'
import { LicenseDetails } from './pages/LicenseDetails'
import { MainLayout } from './components/layout/MainLayout'
import { useAuth } from './contexts/AuthContext'
import { License, OwnerInfo } from './hooks/useLicenses'

export type PageType = 'dashboard' | 'settings' | 'edit-profile' | 'edit-entity' | 'edit-notifications' | 'pricing' | 'login' | 'signup' | 'success' | 'reset-password' | 'forgot-password' | 'licenses' | 'license-details' | 'accept-invitation' | 'add-accountant' | 'other-settings' | 'documents' | 'receipts' | 'chats' | 'messages' | 'todos' | 'entities' | 'bookmarks' | 'reports' | 'batch-view'

function App() {
  const { user, profile, loading } = useAuth()
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard')
  const [previousPage, setPreviousPage] = useState<PageType>('dashboard')
  const [invitationToken, setInvitationToken] = useState<string | null>(null)
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [selectedLicense, setSelectedLicense] = useState<License | OwnerInfo | null>(null)
  const [isOwnerLicense, setIsOwnerLicense] = useState(false)
  const hasInitializedRef = useRef(false)

  useEffect(() => {
    console.log('✅ App initialized - Supabase configuration loaded');
    console.log('📍 Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
    console.log('🔑 Anon Key configured:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Yes' : 'No');
  }, []);

  useEffect(() => {
    // Check for password reset link
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const type = hashParams.get('type')
    if (type === 'recovery') {
      setCurrentPage('reset-password')
      return
    }

    // Check for page parameter in URL (for Stripe redirects and other routes)
    const params = new URLSearchParams(window.location.search)

    // Check for invitation link
    const inviteToken = params.get('invite')
    if (inviteToken) {
      setInvitationToken(inviteToken)
      setCurrentPage('accept-invitation')
      return
    }

    const pageParam = params.get('page') as PageType
    if (pageParam && ['success', 'pricing', 'signup'].includes(pageParam)) {
      setCurrentPage(pageParam)
      // Don't clean up URL for signup page as it may have email and invite_token params
      if (pageParam !== 'signup') {
        window.history.replaceState({}, '', window.location.pathname)
      }
    }
  }, [])

  useEffect(() => {
    if (loading) return

    const publicPages: PageType[] = ['login', 'signup', 'reset-password', 'forgot-password', 'accept-invitation']
    const authRequiredPages: PageType[] = ['success', 'pricing']
    const isAuthenticated = user && profile

    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true
      if (!isAuthenticated && !publicPages.includes(currentPage) && !authRequiredPages.includes(currentPage)) {
        setCurrentPage('login')
      } else if (!isAuthenticated && authRequiredPages.includes(currentPage)) {
        setCurrentPage('login')
      } else if (isAuthenticated && ['login', 'signup'].includes(currentPage)) {
        setCurrentPage('dashboard')
      }
      return
    }

    if (!isAuthenticated && !publicPages.includes(currentPage) && !authRequiredPages.includes(currentPage)) {
      setCurrentPage('login')
    } else if (isAuthenticated && ['login', 'signup'].includes(currentPage)) {
      setCurrentPage('dashboard')
    }
  }, [user, profile, loading, currentPage])

  useEffect(() => {
    // Reset scroll position to top when navigating to a new page
    window.scrollTo(0, 0)
  }, [currentPage])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const handleNavigate = (page: PageType, chatId?: string, licenseData?: { license: License | OwnerInfo; isOwner: boolean }) => {
    setPreviousPage(currentPage)
    setCurrentPage(page)
    if (chatId) {
      setActiveChatId(chatId)
    } else {
      setActiveChatId(null)
    }
    if (licenseData) {
      setSelectedLicense(licenseData.license)
      setIsOwnerLicense(licenseData.isOwner)
    } else {
      setSelectedLicense(null)
      setIsOwnerLicense(false)
    }
  }

  const renderPage = () => {
    const publicPages: PageType[] = ['login', 'signup', 'reset-password', 'forgot-password', 'accept-invitation']
    const shouldUseLayout = user && profile && !publicPages.includes(currentPage)

    const pageContent = (() => {
      switch (currentPage) {
        case 'dashboard':
          return <Dashboard onNavigate={handleNavigate} />
        case 'settings':
          return <Settings onNavigate={handleNavigate} />
        case 'edit-profile':
          return <EditProfile onNavigate={handleNavigate} />
        case 'edit-entity':
          return <EditEntity onNavigate={handleNavigate} />
        case 'edit-notifications':
          return <EditNotifications onNavigate={handleNavigate} />
        case 'licenses':
          return <Licenses onNavigate={handleNavigate} />
        case 'license-details':
          return <LicenseDetails
            license={selectedLicense}
            isOwnerLicense={isOwnerLicense}
            onBack={() => handleNavigate('licenses')}
            onArchive={(id) => console.log('Archive license:', id)}
            onReactivate={(id) => console.log('Reactivate license:', id)}
            onDelete={(id) => console.log('Delete license:', id)}
            onCopyInvite={(token) => console.log('Copy invite:', token)}
          />
        case 'add-accountant':
          return <AddAccountant onNavigate={handleNavigate} />
        case 'other-settings':
          return <OtherSettings onNavigate={handleNavigate} />
        case 'documents':
          return <Documents onNavigate={handleNavigate} />
        case 'receipts':
          return <Receipts onNavigate={handleNavigate} />
        case 'chats':
          return <Chats onNavigate={handleNavigate} initialChatId={activeChatId} />
        case 'messages':
          return <Messages onNavigate={handleNavigate} onBack={() => handleNavigate('dashboard')} onNavigateToChat={(id) => console.log('Navigate to chat:', id)} />
        case 'todos':
          return <TodoList onNavigate={handleNavigate} onBack={() => handleNavigate('dashboard')} onNavigateToTodo={(id) => console.log('Navigate to todo:', id)} />
        case 'entities':
          return <Entities onNavigate={handleNavigate} />
        case 'bookmarks':
          return <Bookmarks onNavigate={handleNavigate} />
        case 'reports':
          return <Reports onNavigate={handleNavigate} />
        case 'batch-view':
          return <BatchView onNavigate={handleNavigate} />
        case 'pricing':
          return <Pricing onNavigate={handleNavigate} previousPage={previousPage} />
        case 'success':
          return <Success onNavigate={handleNavigate} />
        case 'accept-invitation':
          return invitationToken ? (
            <AcceptInvitation invitationToken={invitationToken} onNavigate={handleNavigate} />
          ) : (
            <Login onNavigate={handleNavigate} />
          )
        case 'login':
          return <Login onNavigate={handleNavigate} />
        case 'signup':
          return <Signup onNavigate={handleNavigate} />
        case 'reset-password':
          return <ResetPassword />
        case 'forgot-password':
          return <ForgotPassword onNavigate={handleNavigate} />
        default:
          return <Dashboard onNavigate={handleNavigate} />
      }
    })()

    if (shouldUseLayout) {
      return (
        <MainLayout currentPage={currentPage} onNavigate={handleNavigate}>
          {pageContent}
        </MainLayout>
      )
    }

    return pageContent
  }

  return <>{renderPage()}</>
}

export default App