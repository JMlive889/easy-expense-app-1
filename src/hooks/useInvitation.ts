import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface InvitationDetails {
  invitedEmail: string
  entityName: string
  ownerName: string
  licenseType: string
  status: string
}

interface UseInvitationResult {
  invitation: InvitationDetails | null
  loading: boolean
  error: string | null
}

export function useInvitation(inviteToken: string | null): UseInvitationResult {
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!inviteToken) {
      setInvitation(null)
      setLoading(false)
      setError(null)
      return
    }

    const fetchInvitationDetails = async () => {
      setLoading(true)
      setError(null)

      try {
        const { data: license, error: licenseError } = await supabase
          .from('licenses')
          .select(`
            invited_email,
            license_type,
            status,
            entity_id,
            owner_id
          `)
          .eq('invitation_token', inviteToken)
          .maybeSingle()

        if (licenseError) {
          throw licenseError
        }

        if (!license) {
          setError('Invitation not found or invalid')
          setLoading(false)
          return
        }

        if (license.status === 'archived') {
          setError('This invitation has been archived')
          setLoading(false)
          return
        }

        if (license.status === 'active') {
          setError('This invitation has already been accepted')
          setLoading(false)
          return
        }

        const { data: entity, error: entityError } = await supabase
          .from('entities')
          .select('entity_name')
          .eq('id', license.entity_id)
          .maybeSingle()

        if (entityError) {
          throw entityError
        }

        const { data: owner, error: ownerError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', license.owner_id)
          .maybeSingle()

        if (ownerError) {
          throw ownerError
        }

        setInvitation({
          invitedEmail: license.invited_email,
          entityName: entity?.entity_name || 'Unknown Entity',
          ownerName: owner?.full_name || 'Unknown Owner',
          licenseType: license.license_type,
          status: license.status,
        })
      } catch (err) {
        console.error('Error fetching invitation details:', err)
        setError('Failed to load invitation details')
      } finally {
        setLoading(false)
      }
    }

    fetchInvitationDetails()
  }, [inviteToken])

  return { invitation, loading, error }
}
