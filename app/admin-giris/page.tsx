import { getSetting } from '@/lib/utils'
import LoginForm from './LoginForm'

export default async function AdminLoginPage() {
  const [siteName, siteLogo] = await Promise.all([
    getSetting('site_name', 'Yönetim Paneli'),
    getSetting('site_logo', ''),
  ])

  return <LoginForm siteName={siteName} siteLogo={siteLogo} />
}
