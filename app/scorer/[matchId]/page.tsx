import { notFound } from 'next/navigation'
import { getBasketballState } from '@/app/scorer/actions'
import { ScorerConsole } from '@/components/scorer-console'

export default async function ScorerMatchPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params
  try {
    const data = await getBasketballState(matchId)
    if (!data.match) notFound()
    return <ScorerConsole matchId={matchId} sport={data.sport as 'basketball' | 'volleyball' | 'badminton'} initialState={data} />
  } catch { notFound() }
}
