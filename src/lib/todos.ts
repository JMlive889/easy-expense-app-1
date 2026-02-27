import { supabase } from './supabase'
import { signedUrlCache } from './cache/signedUrlCache'

export interface Todo {
  id: string
  title: string | null
  content: string
  category: 'general' | 'docs' | 'messages' | 'receipts'
  is_completed: boolean
  bookmark: boolean
  entity_id: string
  created_by: string
  document_id: string | null
  parent_task_id: string | null
  assigned_users: string[]
  read_by: string[]
  type: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
  creator?: {
    id: string
    full_name: string | null
    email: string | null
    avatar_url: string | null
  }
  assigned_profiles?: Array<{
    id: string
    full_name: string | null
    email: string | null
    avatar_url: string | null
  }>
  document?: {
    id: string
    display_name: string
    type: string | null
    file_path: string
    signed_url?: string | null
  }
  reply_count?: number
}

export interface CreateTodoInput {
  title?: string
  content: string
  category: 'general' | 'docs' | 'messages' | 'receipts'
  documentId?: string
  assignedUsers?: string[]
  type?: string
}

export interface CreateReplyInput {
  parentTaskId: string
  content: string
  assignedUsers?: string[]
}

async function generateSignedUrlForDocument(document: any) {
  if (!document?.file_path) return null
  return await signedUrlCache.generateOrGetCached(document.file_path)
}

async function batchGenerateSignedUrlsForDocuments(documents: any[]): Promise<Map<string, string>> {
  const filePaths = documents
    .map(doc => doc?.file_path)
    .filter((path): path is string => !!path)

  if (filePaths.length === 0) {
    return new Map()
  }

  return await signedUrlCache.batchGenerateOrGetCached(filePaths)
}

async function batchGetProfiles(userIds: string[]): Promise<Map<string, any>> {
  if (userIds.length === 0) {
    return new Map()
  }

  const uniqueIds = Array.from(new Set(userIds))

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url')
    .in('id', uniqueIds)

  const profileMap = new Map()
  if (profiles) {
    profiles.forEach(profile => {
      profileMap.set(profile.id, profile)
    })
  }

  return profileMap
}

async function batchGetReplyCounts(taskIds: string[]): Promise<Map<string, number>> {
  if (taskIds.length === 0) {
    return new Map()
  }

  const { data: replyCounts } = await supabase
    .from('tasks')
    .select('parent_task_id')
    .in('parent_task_id', taskIds)

  const countMap = new Map<string, number>()
  taskIds.forEach(id => countMap.set(id, 0))

  if (replyCounts) {
    replyCounts.forEach(reply => {
      const currentCount = countMap.get(reply.parent_task_id) || 0
      countMap.set(reply.parent_task_id, currentCount + 1)
    })
  }

  return countMap
}

export async function createTodo(input: CreateTodoInput) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, current_entity_id')
    .eq('id', (await supabase.auth.getUser()).data.user?.id)
    .maybeSingle()

  if (!profile?.current_entity_id) {
    return { data: null, error: new Error('User profile or entity not found') }
  }

  const todoData = {
    title: input.title || null,
    content: input.content,
    category: input.category,
    entity_id: profile.current_entity_id,
    created_by: profile.id,
    document_id: input.documentId || null,
    assigned_users: input.assignedUsers || [],
    type: input.type || null,
    bookmark: false,
    is_completed: false,
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert(todoData)
    .select()
    .single()

  return { data, error }
}

export async function createReply(input: CreateReplyInput) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, current_entity_id')
    .eq('id', (await supabase.auth.getUser()).data.user?.id)
    .maybeSingle()

  if (!profile?.current_entity_id) {
    return { data: null, error: new Error('User profile or entity not found') }
  }

  const { data: parentTask } = await supabase
    .from('tasks')
    .select('document_id, type, category')
    .eq('id', input.parentTaskId)
    .maybeSingle()

  const replyData = {
    content: input.content,
    parent_task_id: input.parentTaskId,
    category: parentTask?.category || 'messages',
    entity_id: profile.current_entity_id,
    created_by: profile.id,
    document_id: parentTask?.document_id || null,
    assigned_users: input.assignedUsers || [],
    type: parentTask?.type || null,
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert(replyData)
    .select()
    .single()

  return { data, error }
}

export async function getTodosByCategory(category?: string, includeCompleted = false) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: new Error('Not authenticated') }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, current_entity_id')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.current_entity_id) {
    return { data: null, error: new Error('User profile or entity not found') }
  }

  // Get user's role in the current entity
  const { data: membership } = await supabase
    .from('entity_memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('entity_id', profile.current_entity_id)
    .eq('is_active', true)
    .maybeSingle()

  const userRole = membership?.role || 'guest'

  let query = supabase
    .from('tasks')
    .select(`
      *,
      creator:profiles!tasks_created_by_fkey(id, full_name, email, avatar_url),
      document:documents!tasks_document_id_fkey(id, display_name, type, file_path)
    `)
    .eq('entity_id', profile.current_entity_id)
    .is('parent_task_id', null)
    .order('created_at', { ascending: false })

  // Role-based filtering: guests only see todos they created or are assigned to
  if (userRole === 'guest') {
    query = query.or(`created_by.eq.${user.id},assigned_users.cs.{${user.id}}`)
  }

  if (category) {
    query = query.eq('category', category)
  }

  if (!includeCompleted) {
    query = query.eq('is_completed', false)
  }

  const { data, error } = await query

  if (error) return { data: null, error }
  if (!data || data.length === 0) return { data: [], error: null }

  const allUserIds = Array.from(
    new Set(
      data.flatMap(todo => todo.assigned_users || [])
    )
  )

  const taskIds = data.map(todo => todo.id)
  const documents = data.map(todo => todo.document).filter(doc => doc)

  const [profileMap, replyCountMap, urlMap] = await Promise.all([
    batchGetProfiles(allUserIds),
    batchGetReplyCounts(taskIds),
    batchGenerateSignedUrlsForDocuments(documents)
  ])

  const todosWithProfiles = data.map(todo => {
    const assignedProfiles = (todo.assigned_users || [])
      .map(userId => profileMap.get(userId))
      .filter(profile => profile)

    const signedUrl = todo.document?.file_path
      ? urlMap.get(todo.document.file_path)
      : null

    return {
      ...todo,
      document: todo.document
        ? { ...todo.document, signed_url: signedUrl }
        : undefined,
      assigned_profiles: assignedProfiles,
      reply_count: replyCountMap.get(todo.id) || 0,
    }
  })

  return { data: todosWithProfiles as Todo[], error: null }
}

export async function getBookmarkedTodosByCategory(category?: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: new Error('Not authenticated') }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, current_entity_id')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.current_entity_id) {
    return { data: null, error: new Error('User profile or entity not found') }
  }

  const { data: membership } = await supabase
    .from('entity_memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('entity_id', profile.current_entity_id)
    .eq('is_active', true)
    .maybeSingle()

  const userRole = membership?.role || 'guest'

  let query = supabase
    .from('tasks')
    .select(`
      *,
      creator:profiles!tasks_created_by_fkey(id, full_name, email, avatar_url),
      document:documents!tasks_document_id_fkey(id, display_name, type, file_path)
    `)
    .eq('entity_id', profile.current_entity_id)
    .eq('bookmark', true)
    .is('parent_task_id', null)
    .order('created_at', { ascending: false })

  if (userRole === 'guest') {
    query = query.or(`created_by.eq.${user.id},assigned_users.cs.{${user.id}}`)
  }

  if (category) {
    query = query.eq('category', category)
  }

  const { data, error } = await query

  if (error) return { data: null, error }
  if (!data || data.length === 0) return { data: [], error: null }

  const allUserIds = Array.from(
    new Set(
      data.flatMap(todo => todo.assigned_users || [])
    )
  )

  const taskIds = data.map(todo => todo.id)
  const documents = data.map(todo => todo.document).filter(doc => doc)

  const [profileMap, replyCountMap, urlMap] = await Promise.all([
    batchGetProfiles(allUserIds),
    batchGetReplyCounts(taskIds),
    batchGenerateSignedUrlsForDocuments(documents)
  ])

  const todosWithProfiles = data.map(todo => {
    const assignedProfiles = (todo.assigned_users || [])
      .map(userId => profileMap.get(userId))
      .filter(profile => profile)

    const signedUrl = todo.document?.file_path
      ? urlMap.get(todo.document.file_path)
      : null

    return {
      ...todo,
      document: todo.document
        ? { ...todo.document, signed_url: signedUrl }
        : undefined,
      assigned_profiles: assignedProfiles,
      reply_count: replyCountMap.get(todo.id) || 0,
    }
  })

  return { data: todosWithProfiles as Todo[], error: null }
}

export async function getInboxMessages() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: new Error('Not authenticated') }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, current_entity_id')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.current_entity_id) {
    return { data: null, error: new Error('User profile or entity not found') }
  }

  // Get user's role in the current entity
  const { data: membership } = await supabase
    .from('entity_memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('entity_id', profile.current_entity_id)
    .eq('is_active', true)
    .maybeSingle()

  const userRole = membership?.role || 'guest'

  let query = supabase
    .from('tasks')
    .select(`
      *,
      creator:profiles!tasks_created_by_fkey(id, full_name, email, avatar_url),
      document:documents!tasks_document_id_fkey(id, display_name, type, file_path)
    `)
    .eq('entity_id', profile.current_entity_id)
    .is('parent_task_id', null)
    .order('created_at', { ascending: false })

  // Owners and accountants see all messages, guests only see assigned messages
  if (userRole === 'owner' || userRole === 'accountant') {
    query = query.not('assigned_users', 'is', null)
  } else {
    query = query.contains('assigned_users', [user.id])
  }

  const { data, error } = await query

  if (error) return { data: null, error }
  if (!data || data.length === 0) return { data: [], error: null }

  const allUserIds = Array.from(
    new Set(
      data.flatMap(message => message.assigned_users || [])
    )
  )

  const taskIds = data.map(message => message.id)
  const documents = data.map(message => message.document).filter(doc => doc)

  const [profileMap, replyCountMap, urlMap] = await Promise.all([
    batchGetProfiles(allUserIds),
    batchGetReplyCounts(taskIds),
    batchGenerateSignedUrlsForDocuments(documents)
  ])

  const messagesWithProfiles = data.map(message => {
    const assignedProfiles = (message.assigned_users || [])
      .map(userId => profileMap.get(userId))
      .filter(profile => profile)

    const signedUrl = message.document?.file_path
      ? urlMap.get(message.document.file_path)
      : null

    return {
      ...message,
      document: message.document
        ? { ...message.document, signed_url: signedUrl }
        : undefined,
      assigned_profiles: assignedProfiles,
      reply_count: replyCountMap.get(message.id) || 0,
    }
  })

  return { data: messagesWithProfiles as Todo[], error: null }
}

export async function getSentMessages() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: new Error('Not authenticated') }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, current_entity_id')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.current_entity_id) {
    return { data: null, error: new Error('User profile or entity not found') }
  }

  // Get user's role in the current entity
  const { data: membership } = await supabase
    .from('entity_memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('entity_id', profile.current_entity_id)
    .eq('is_active', true)
    .maybeSingle()

  const userRole = membership?.role || 'guest'

  let query = supabase
    .from('tasks')
    .select(`
      *,
      creator:profiles!tasks_created_by_fkey(id, full_name, email, avatar_url),
      document:documents!tasks_document_id_fkey(id, display_name, type, file_path)
    `)
    .eq('entity_id', profile.current_entity_id)
    .not('assigned_users', 'is', null)
    .is('parent_task_id', null)
    .order('created_at', { ascending: false })

  // Owners and accountants see all sent messages, guests only see their own
  if (userRole === 'owner' || userRole === 'accountant') {
    // Show all messages in the entity (could be filtered further if needed)
  } else {
    query = query.eq('created_by', user.id)
  }

  const { data, error } = await query

  if (error) return { data: null, error }
  if (!data || data.length === 0) return { data: [], error: null }

  const allUserIds = Array.from(
    new Set(
      data.flatMap(message => message.assigned_users || [])
    )
  )

  const taskIds = data.map(message => message.id)
  const documents = data.map(message => message.document).filter(doc => doc)

  const [profileMap, replyCountMap, urlMap] = await Promise.all([
    batchGetProfiles(allUserIds),
    batchGetReplyCounts(taskIds),
    batchGenerateSignedUrlsForDocuments(documents)
  ])

  const messagesWithProfiles = data.map(message => {
    const assignedProfiles = (message.assigned_users || [])
      .map(userId => profileMap.get(userId))
      .filter(profile => profile)

    const signedUrl = message.document?.file_path
      ? urlMap.get(message.document.file_path)
      : null

    return {
      ...message,
      document: message.document
        ? { ...message.document, signed_url: signedUrl }
        : undefined,
      assigned_profiles: assignedProfiles,
      reply_count: replyCountMap.get(message.id) || 0,
    }
  })

  return { data: messagesWithProfiles as Todo[], error: null }
}

export async function getMessageThread(taskId: string) {
  const { data: parentTask, error: parentError } = await supabase
    .from('tasks')
    .select(`
      *,
      creator:profiles!tasks_created_by_fkey(id, full_name, email, avatar_url),
      document:documents!tasks_document_id_fkey(id, display_name, type, file_path)
    `)
    .eq('id', taskId)
    .maybeSingle()

  if (parentError || !parentTask) {
    return { data: null, error: parentError || new Error('Task not found') }
  }

  const { data: replies, error: repliesError } = await supabase
    .from('tasks')
    .select(`
      *,
      creator:profiles!tasks_created_by_fkey(id, full_name, email, avatar_url)
    `)
    .eq('parent_task_id', taskId)
    .order('created_at', { ascending: true })

  if (repliesError) {
    return { data: { parent: parentTask, replies: [] }, error: null }
  }

  if (parentTask.assigned_users && parentTask.assigned_users.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .in('id', parentTask.assigned_users)

    parentTask.assigned_profiles = profiles || []
  }

  const signedUrl = parentTask.document ? await generateSignedUrlForDocument(parentTask.document) : null
  if (parentTask.document) {
    parentTask.document = { ...parentTask.document, signed_url: signedUrl }
  }

  return {
    data: {
      parent: parentTask as Todo,
      replies: (replies || []) as Todo[],
    },
    error: null,
  }
}

export async function toggleTodoComplete(todoId: string, isCompleted: boolean) {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
    })
    .eq('id', todoId)
    .select()
    .single()

  return { data, error }
}

export async function toggleTodoBookmark(todoId: string, bookmark: boolean) {
  const { data, error } = await supabase
    .from('tasks')
    .update({ bookmark })
    .eq('id', todoId)
    .select()
    .single()

  return { data, error }
}

export async function assignUsersToTodo(todoId: string, userIds: string[]) {
  const { data, error } = await supabase
    .from('tasks')
    .update({ assigned_users: userIds })
    .eq('id', todoId)
    .select()
    .single()

  return { data, error }
}

export async function getEntityUsers(entityId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url')
    .eq('current_entity_id', entityId)
    .order('full_name')

  return { data, error }
}

export async function markMessageRead(todoId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: new Error('Not authenticated') }

  const { data: task } = await supabase
    .from('tasks')
    .select('read_by')
    .eq('id', todoId)
    .maybeSingle()

  if (!task) return { error: new Error('Task not found') }

  const readBy = task.read_by || []
  if (!readBy.includes(user.id)) {
    readBy.push(user.id)

    const { error } = await supabase
      .from('tasks')
      .update({ read_by: readBy })
      .eq('id', todoId)

    return { error }
  }

  return { error: null }
}

export async function getUnreadCount() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: 0, error: new Error('Not authenticated') }

  const { count, error } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .contains('assigned_users', [user.id])
    .not('read_by', 'cs', `{${user.id}}`)

  return { data: count || 0, error }
}

export async function deleteTodo(todoId: string) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', todoId)

  return { error }
}

export async function getDocumentTodos(documentId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      creator:profiles!tasks_created_by_fkey(id, full_name, email, avatar_url)
    `)
    .eq('document_id', documentId)
    .is('parent_task_id', null)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error }
  if (!data || data.length === 0) return { data: [], error: null }

  const allUserIds = Array.from(
    new Set(
      data.flatMap(todo => todo.assigned_users || [])
    )
  )

  const profileMap = await batchGetProfiles(allUserIds)

  const todosWithProfiles = data.map(todo => {
    const assignedProfiles = (todo.assigned_users || [])
      .map(userId => profileMap.get(userId))
      .filter(profile => profile)

    return {
      ...todo,
      assigned_profiles: assignedProfiles,
    }
  })

  return { data: todosWithProfiles as Todo[], error: null }
}

export async function updateTodo(
  todoId: string,
  updates: {
    title?: string
    content?: string
    assignedUsers?: string[]
    bookmark?: boolean
  }
) {
  const updateData: any = {}

  if (updates.title !== undefined) updateData.title = updates.title
  if (updates.content !== undefined) updateData.content = updates.content
  if (updates.assignedUsers !== undefined) updateData.assigned_users = updates.assignedUsers
  if (updates.bookmark !== undefined) updateData.bookmark = updates.bookmark

  updateData.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', todoId)
    .select()
    .single()

  return { data, error }
}
