import PagePath from '@root/constants/pagePath';
import { useTour } from '@root/hooks/useTour';
import { GetServerSidePropsContext, NextApiRequest } from 'next';
import Link from 'next/link';
import React, { useCallback } from 'react';
import { CallBackProps } from 'react-joyride';
import FormattedCampaign from '../../components/formatted/formattedCampaign';
import LinkInfo from '../../components/formatted/linkInfo';
import Page from '../../components/page/page';
import getCampaignProps, { CampaignProps } from '../../helpers/getCampaignProps';
import { getUserFromToken } from '../../lib/withAuth';

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const token = context.req?.cookies?.token;
  const reqUser = token ? await getUserFromToken(token, context.req as NextApiRequest) : null;

  if (!reqUser) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  return await getCampaignProps(reqUser, 'chapter1');
}

/* istanbul ignore next */
export default function Chapter1Page({ enrichedCollections, reqUser, solvedLevels, totalLevels }: CampaignProps) {
  const memoizedCallback = useCallback((data: CallBackProps) => {
    if (data.action === 'next' && data.index === 0) {
      // get the first level a tag
      const firstLevel = document.querySelector('#level-selectcard-0 a');

      if (firstLevel) {
        (firstLevel as HTMLAnchorElement).click();
      }
    }
  }, []);
  const tour = useTour(PagePath.CHAPTER_1, memoizedCallback);

  return (
    <Page folders={[new LinkInfo('Chapter Select', '/play')]} title={'Chapter 1'}>
      <>
        {tour}
        <FormattedCampaign
          enrichedCollections={enrichedCollections}
          levelHrefQuery={'chapter=1'}
          nextHref={'/chapter2'}
          nextTitle={(reqUser.chapterUnlocked ?? 1) < 2 ? 'Unlock Chapter 2' : undefined}
          solvedElement={
            <div className='flex flex-col items-center justify-center text-center mt-2'>
              <div>Congratulations! You&apos;ve solved every level in Chapter 1. Try out <Link className='font-bold underline' href='/chapter2' passHref>Chapter 2</Link> next!</div>
            </div>
          }
          solvedLevels={solvedLevels}
          subtitle={'Grassroots'}
          title={'Chapter 1'}
          totalLevels={totalLevels}
        />
      </>
    </Page>
  );
}
