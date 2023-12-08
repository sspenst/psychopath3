import { AppContext } from '@root/contexts/appContext';
import { getGameIdFromReq } from '@root/helpers/getGameIdFromReq';
import { GetServerSidePropsContext } from 'next';
import { NextSeo } from 'next-seo';
import React, { useContext } from 'react';
import { SWRConfig } from 'swr';
import HomeDefault from '../../components/homepage/homeDefault';
import HomeVideo from '../../components/homepage/homeVideo';
import RecommendedLevel from '../../components/homepage/recommendedLevel';
import Page from '../../components/page/page';
import getSWRKey from '../../helpers/getSWRKey';
import useLevelOfDay from '../../hooks/useLevelOfDay';
import { EnrichedLevel } from '../../models/db/level';
import { getLevelOfDay } from '../api/level-of-day';

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const gameId = getGameIdFromReq(context.req);
  const levelOfDay: EnrichedLevel | null = await getLevelOfDay(gameId);

  return {
    props: {
      levelOfDay: JSON.parse(JSON.stringify(levelOfDay)),
    } as AppSWRProps,
  };
}

interface AppSWRProps {
  levelOfDay: EnrichedLevel;
}

/* istanbul ignore next */
export default function AppSWR({ levelOfDay }: AppSWRProps) {
  return (
    <SWRConfig value={{ fallback: {
      [getSWRKey('/api/level-of-day')]: levelOfDay,
    } }}>
      <App />
    </SWRConfig>
  );
}

/* istanbul ignore next */
function App() {
  const { levelOfDay } = useLevelOfDay();

  const { game } = useContext(AppContext);

  return (
    <Page title={game.displayName}>
      <>
        <NextSeo
          title={game.SEOTitle}
          openGraph={{
            title: game.SEOTitle,
            description: game.SEODescription,
            images: [
              {
                url: 'https://' + game.baseUrl + '/logo.png',
                width: 128,
                height: 128,
                alt: game.displayName + ' Logo',
                type: 'image/png',
              },
            ],
          }}
        />
        <HomeVideo />
        <div className='flex flex-wrap justify-center m-4'>
          {levelOfDay &&
            <RecommendedLevel
              id='level-of-day'
              level={levelOfDay}
              title='Level of the Day'
              tooltip={'Every day there is a new level of the day. Difficulty increases throughout the week!'}
            />
          }
        </div>
        <HomeDefault />
      </>
    </Page>
  );
}
