import moment from 'moment';
import { GetServerSidePropsContext, NextApiRequest } from 'next';
import { useRouter } from 'next/router';
import React, { useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import EnrichedLevelLink from '../../../components/enrichedLevelLink';
import FormattedUser from '../../../components/formattedUser';
import Game from '../../../components/level/game';
import MultiplayerMatchLobbyItem from '../../../components/multiplayerMatchLobbyItem';
import MultiplayerMatchScoreboard from '../../../components/multiplayerMatchScoreboard';
import Page from '../../../components/page';
import SkeletonPage from '../../../components/skeletonPage';
import useMatch from '../../../hooks/useMatch';
import { getUserFromToken } from '../../../lib/withAuth';
import Control from '../../../models/control';
import Level from '../../../models/db/level';
import User, { ReqUser } from '../../../models/db/user';
import { MatchAction, MatchLog, MultiplayerMatchState } from '../../../models/MultiplayerEnums';

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const token = context.req?.cookies?.token;
  const reqUser = token ? await getUserFromToken(token, context.req as NextApiRequest) : null;

  if (!reqUser) {
    // redirect to login page
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  const { matchId } = context.query;

  return {
    props: {
      matchId: matchId,
    },
  };
}

export default function MatchGame({ matchId }: {user: ReqUser, matchId: string}) {
  const [poll, setPoll] = React.useState<boolean>(true);
  const [usedSkip, setUsedSkip] = React.useState<boolean>(false);
  const { match } = useMatch(matchId, poll);
  const [activeLevel, setActiveLevel] = React.useState<Level | null>(null);
  const [timestart, setTimestart] = React.useState<number>(Date.now());
  const router = useRouter();
  const btnSkip = async() => {
    if (confirm('Are you sure you want to skip this level? You only get one skip per Match.')) {
      toast.loading('Skipping level...');
      const res = await fetch(`/api/match/${matchId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: MatchAction.SKIP_LEVEL,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.dismiss();
        toast.error(data.error || 'Failed to skip level');
      } else {
        toast.dismiss();
        toast.success('Skipped level');
        setUsedSkip(true);
      }
    }
  };
  const skipControl = useCallback((disabled = false) => new Control(
    'control-skip',
    () => btnSkip(),
    <div className='flex justify-center'>
      <span className='pl-2'>
      Skip
      </span>
      <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='currentColor' className='bi bi-arrow-right-short' viewBox='0 0 16 16'>
        <path fillRule='evenodd' d='M4 8a.5.5 0 0 1 .5-.5h5.793L8.146 5.354a.5.5 0 1 1 .708-.708l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L10.293 8.5H4.5A.5.5 0 0 1 4 8z' />
      </svg>
    </div>,
    disabled,
    !disabled,
  ), []);

  useEffect(() => {
    if (!match) {
      //toast.error('Cannot find this match');

      //setPoll(false);
      // router.push('/match');

      return;
    }

    if (match.state === MultiplayerMatchState.ABORTED) {
      setPoll(false);
      toast.error('Match has been aborted');
      // redirect user
      router.push('/match');

      return;
    }

    if (match.state === MultiplayerMatchState.FINISHED) {
      toast.success('Match complete');
      // redirect user
      setPoll(false);
    }

    if (match.levels.length > 0) {
      setActiveLevel(match.levels[0]);
    }

    const ts = Date.now() + match.timeUntilStart;

    setTimestart(ts > 0 ? ts : 0);
  }, [match, router]);
  useEffect(() => {
    // check if match already has a GAME_START log

    for (const log of match?.matchLog || []) {
      if (log.type === MatchAction.GAME_START || log.type === MatchAction.GAME_END) {
        return;
      }
    }

    match?.matchLog?.push({
      type: MatchAction.GAME_START,
      createdAt: match.startTime,
      data: {}
    });
    match?.matchLog?.push({
      type: MatchAction.GAME_END,
      createdAt: match.endTime,
      data: {}
    });
  }, [match]);

  if (!match) {
    return <SkeletonPage />;
  }

  match.matchLog = match?.matchLog?.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const timeCountDownClean = ((timestart - Date.now()) / 1000) >> 0;
  const playerMap = new Map<string, User>();

  for (const player of match.players) {
    playerMap.set(player._id.toString(), player);
  }

  const parseRules = {
    [MatchAction.CREATE]: () => <><span className='self-center'>Match created</span></>,
    [MatchAction.GAME_START]: () => <><span className='self-center'>Match started</span></>,
    [MatchAction.GAME_END]: () => <><span className='self-center'>Match ended</span></>,
    [MatchAction.SKIP_LEVEL]: (ref: MatchLog) => <><span></span><FormattedUser user={playerMap.get(ref.data.userId) as User} /><span className='self-center'>skipped a level</span></>,
    [MatchAction.JOIN]: (ref: MatchLog) => <><span></span><FormattedUser user={playerMap.get(ref.data.userId) as User} /><span className='self-center'>joined the match</span></>,
    [MatchAction.QUIT]: (ref: MatchLog) => <><FormattedUser user={playerMap.get(ref.data.userId) as User} /><span className='self-center'>quit the match</span></>,
    [MatchAction.COMPLETE_LEVEL]: (ref: MatchLog) => <><FormattedUser user={playerMap.get(ref.data.userId) as User} /><span className='self-center'>completed level</span><span className='self-center'><EnrichedLevelLink level={ref.data.levelId} /></span></>,
  };

  const matchLog = match.matchLog?.map((log: MatchLog, index: number) => {
    const timestamp = new Date(log.createdAt).getTime() - new Date(match.startTime).getTime();
    const date = timestamp >= 0 ? '+' + moment(timestamp).format('mm:ss') : moment(log.createdAt).format('MM/DD/YY hh:mm:ssa');
    const logType = log.type;

    const logTypeDef = parseRules[logType as MatchAction] as (ref: MatchLog) => JSX.Element;
    const logParse = logTypeDef ? logTypeDef(log) : log;
    const logTranslated = <><div className='self-center'>{date} </div>{logParse}</>;

    return (<div key={'log-item' + index} className='grid grid-cols-4 gap-1'>{logTranslated}</div>);
  });

  const finishedState = (<div className='flex flex-col items-center justify-center w-full h-full'>
    <div className='text-2xl font-bold text-center'>Match Finished</div>
    <div className='text-2xl font-bold text-center'>Scoreboard</div>

    <MultiplayerMatchScoreboard match={match} />
    <button className='px-4 py-2 mt-4 text-lg font-bold text-white bg-blue-500 rounded-md hover:bg-blue-600' onClick={() => router.push('/match')}>Back to Lobby</button>
    <div className='flex flex-col gap-2 text-xs p-3 h-full'>
      {matchLog}
    </div>
  </div>);

  const countdownComponent = timeCountDownClean > 0 && (
    <>
      <h1 className='text-4xl font-bold'>Match</h1>
      <h2>Starts in {timeCountDownClean} seconds</h2>
    </>);

  const gameComponent = activeLevel && (
    <div id='game-div-parent' key={'div-' + activeLevel._id.toString()} className='grow h-full w-full'
      style={{

      }}>

      <Game
        allowFreeUndo={true}
        enableLocalSessionRestore={true} // TODO: clear session before playing?
        //disableServer={true}
        matchId={match.matchId}
        key={'game-' + activeLevel._id.toString()}
        hideSidebar={true}
        level={activeLevel}
        extraControls={[skipControl(usedSkip)]}

      />

    </div>
  );
  const scoreboardComponent = !activeLevel ? (
    <MultiplayerMatchLobbyItem match={match}
      onJoinClick={() => {
        console.log('joining');
      }}
      onLeaveClick={() => {
        console.log('leaving');
      }} />
  ) : (
    <MultiplayerMatchScoreboard match={match}
      onLeaveClick={() => {
        console.log('leaving');
      }} />
  );

  return (
    <Page
      title='Multiplayer Match'
      isFullScreen={match.state === MultiplayerMatchState.ACTIVE}
    >
      <div className='flex flex-col items-center justify-center p-3 h-full'>

        {match.state === MultiplayerMatchState.FINISHED ? (
          <> {finishedState }</>
        ) : (
          <>
            {countdownComponent}
            {scoreboardComponent}
            {gameComponent}

          </>
        )}

      </div>

    </Page>
  );
}
