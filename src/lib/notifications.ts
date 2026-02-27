import { supabase } from './supabase'

export interface TaskNotification {
  id: string
  task_id: string
  user_id: string
  notification_type: 'assigned' | 'replied' | 'completed' | 'mentioned'
  is_read: boolean
  sent_via_email: boolean
  sent_via_push: boolean
  metadata: {
    assigner_name?: string
    assigner_id?: string
    replier_name?: string
    replier_id?: string
    completer_name?: string
    completer_id?: string
    task_title?: string
    task_content?: string
    reply_content?: string
    parent_task_id?: string
  }
  created_at: string
  task?: {
    id: string
    title: string | null
    content: string
    category: string
    document_id: string | null
  }
}

export async function getUnreadNotifications() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: new Error('Not authenticated') }

  const { data, error } = await supabase
    .from('task_notifications')
    .select(`
      *,
      task:tasks(id, title, content, category, document_id)
    `)
    .eq('user_id', user.id)
    .eq('is_read', false)
    .order('created_at', { ascending: false })

  return { data: data as TaskNotification[], error }
}

export async function getAllNotifications(limit = 50) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: new Error('Not authenticated') }

  const { data, error } = await supabase
    .from('task_notifications')
    .select(`
      *,
      task:tasks(id, title, content, category, document_id)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  return { data: data as TaskNotification[], error }
}

export async function getUnreadNotificationCount() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: 0, error: new Error('Not authenticated') }

  const { count, error } = await supabase
    .from('task_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  return { data: count || 0, error }
}

export async function markNotificationRead(notificationId: string) {
  const { data, error } = await supabase
    .from('task_notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .select()
    .single()

  return { data, error }
}

export async function markAllNotificationsRead() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: new Error('Not authenticated') }

  const { error } = await supabase
    .from('task_notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  return { error }
}

export async function deleteNotification(notificationId: string) {
  const { error } = await supabase
    .from('task_notifications')
    .delete()
    .eq('id', notificationId)

  return { error }
}

export async function sendEmailNotification(
  userId: string,
  notificationType: string,
  metadata: any
) {
  try {
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('email, email_notifications, full_name')
      .eq('id', userId)
      .maybeSingle()

    if (!userProfile?.email_notifications) {
      return { success: false, message: 'Email notifications disabled for user' }
    }

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-notification`
    const headers = {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    }

    const payload = {
      userId,
      email: userProfile.email,
      notificationType,
      metadata,
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error('Failed to send email notification')
    }

    return { success: true, message: 'Email notification sent' }
  } catch (error) {
    console.error('Error sending email notification:', error)
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export function subscribeToNotifications(
  userId: string,
  callback: (notification: TaskNotification) => void
) {
  const channel = supabase
    .channel('task_notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'task_notifications',
        filter: `user_id=eq.${userId}`,
      },
      async (payload) => {
        const { data: task } = await supabase
          .from('tasks')
          .select('id, title, content, category, document_id')
          .eq('id', payload.new.task_id)
          .maybeSingle()

        callback({
          ...payload.new,
          task,
        } as TaskNotification)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
