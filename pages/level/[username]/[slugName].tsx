/* istanbul ignore file */

import PagePath from '@root/constants/pagePath';
import { useTour } from '@root/hooks/useTour';
import { GetServerSidePropsContext, NextApiRequest } from 'next';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { ParsedUrlQuery } from 'querystring';
import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import LinkInfo from '../../../components/formatted/linkInfo';
import GameWrapper from '../../../components/level/gameWrapper';
import Page from '../../../components/page/page';
import Dimensions from '../../../constants/dimensions';
import { LevelContext } from '../../../contexts/levelContext';
import getProfileSlug from '../../../helpers/getProfileSlug';
import useCollectionById from '../../../hooks/useCollectionById';
import useProStatsLevel from '../../../hooks/useProStatsLevel';
import { getUserFromToken } from '../../../lib/withAuth';
import { EnrichedLevel } from '../../../models/db/level';
import Record from '../../../models/db/record';
import Review from '../../../models/db/review';
import User from '../../../models/db/user';
import { getLevelByUrlPath } from '../../api/level-by-slug/[username]/[slugName]';

export interface LevelUrlQueryParams extends ParsedUrlQuery {
  cid?: string;
  play?: string;
  slugName: string;
  username: string;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { slugName, username } = context.params as LevelUrlQueryParams;
  const token = context.req?.cookies?.token;
  const reqUser = token ? await getUserFromToken(token, context.req as NextApiRequest) : null;
  const level = await getLevelByUrlPath(username, slugName, reqUser);

  if (!level) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      _level: JSON.parse(JSON.stringify(level)),
      reqUser: JSON.parse(JSON.stringify(reqUser)),
    } as LevelProps,
  };
}

interface LevelProps {
  _level: EnrichedLevel;
  reqUser: User | null;
}

export default function LevelPage({ _level, reqUser }: LevelProps) {
  const [level, setLevel] = useState(_level);
  const { mutateProStatsLevel, proStatsLevel } = useProStatsLevel(level);
  const router = useRouter();
  const [sidebarIndex, setSidebarIndex] = useState(0);
  const { chapter, cid, slugName, ts, username } = router.query as LevelUrlQueryParams;
  const { collection } = useCollectionById(cid);

  // handle pressing "Next level"
  useEffect(() => {
    setLevel(_level);
    setSidebarIndex(0);
  }, [_level]);

  const mutateLevel = useCallback(() => {
    // TODO: if we change this to level by id, then we could auto-redirect you to the new slug if the level name updates
    fetch(`/api/level-by-slug/${username}/${slugName}`, {
      method: 'GET',
    }).then(async res => {
      if (res.status === 200) {
        setLevel(await res.json());
      } else {
        throw res.text();
      }
    }).catch(err => {
      console.error(err);
      toast.dismiss();
      toast.error('Error fetching level');
    });
  }, [slugName, username]);

  const changeLevel = function(next: boolean) {
    if (!collection) {
      return;
    }

    let url = chapter ? `/chapter${chapter}` : `/collection/${collection.slug}`;

    // search for index of level._id in collection.levels
    if (collection.levels) {
      const levelIndex = collection.levels.findIndex((l) => l._id === level._id);

      if (next) {
        if (levelIndex + 1 < collection.levels.length) {
          const nextLevel = collection.levels[levelIndex + 1];

          url = `/level/${nextLevel.slug}?cid=${collection._id}${chapter ? `&chapter=${chapter}` : ''}`;
        }
      } else {
        if (levelIndex - 1 >= 0) {
          const prevLevel = collection.levels[levelIndex - 1];

          url = `/level/${prevLevel.slug}?cid=${collection._id}${chapter ? `&chapter=${chapter}` : ''}`;
        }
      }
    }

    router.push(url);
  };

  const [records, setRecords] = useState<Record[]>();

  const getRecords = useCallback(() => {
    fetch(`/api/records/${level._id}`, {
      method: 'GET',
    }).then(async res => {
      if (res.status === 200) {
        setRecords(await res.json());
      } else {
        throw res.text();
      }
    }).catch(err => {
      console.error(err);
      toast.dismiss();
      toast.error('Error fetching records');
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level._id, level.leastMoves]);

  useEffect(() => {
    getRecords();
  }, [getRecords]);

  const [reviews, setReviews] = useState<Review[]>();

  const getReviews = useCallback(() => {
    fetch(`/api/reviews/${level._id}`, {
      method: 'GET',
    }).then(async res => {
      if (res.status === 200) {
        setReviews(await res.json());
      } else {
        throw res.text();
      }
    }).catch(err => {
      console.error(err);
      toast.dismiss();
      toast.error('Error fetching reviews');
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level._id, level.calc_reviews_count]);

  useEffect(() => {
    getReviews();
  }, [getReviews]);

  const folders: LinkInfo[] = [];

  if (chapter) {
    folders.push(
      new LinkInfo('Chapter Select', '/play'),
      new LinkInfo(`Chapter ${chapter}`, `/chapter${chapter}`),
    );

    if (collection) {
      folders.push(new LinkInfo(`${collection.name}`, `/chapter${chapter}`));
    }
  } else if (collection) {
    // if a collection id was passed to the page we can show more directory info
    const user = collection.userId;

    if (user) {
      folders.push(new LinkInfo(user.name, `/profile/${user.name}/collections`));
    }

    folders.push(new LinkInfo(collection.name, `/collection/${collection.slug}`));
  } else {
    // otherwise we can only give a link to the author's levels
    folders.push(new LinkInfo(level.userId.name, `/profile/${level.userId.name}/levels`));
  }

  // subtitle is only useful when a level is within a collection created by a different user
  const showSubtitle = collection && (collection.userId._id !== level.userId._id);
  const ogImageUrl = `/api/level/image/${level._id.toString()}.png${ts ? `?ts=${ts}` : ''}`;
  const ogUrl = `/level/${level.slug}`;
  const ogFullUrl = `https://pathology.gg${ogUrl}`;
  const authorNote = level.authorNote ? level.authorNote : `${level.name} by ${level.userId.name}`;

  const tour = useTour(PagePath.LEVEL, undefined, true);

  return (
    <>
      {tour}
      <NextSeo
        title={`${level.name} - Pathology`}
        description={authorNote}
        canonical={ogFullUrl}
        openGraph={{
          title: `${level.name} - Pathology`,
          description: authorNote,
          type: 'article',
          url: ogUrl,
          images: [
            {
              url: ogImageUrl,
              width: Dimensions.LevelCanvasWidth,
              height: Dimensions.LevelCanvasHeight,
              alt: level.name,
              type: 'image/png',
            },
          ],
        }}
      />
      <LevelContext.Provider value={{
        chapter: !isNaN(Number(chapter)) ? Number(chapter) : undefined,
        collection: collection,
        getReviews: getReviews,
        inCampaign: !!chapter && level.userMoves !== level.leastMoves,
        level: level,
        mutateLevel: mutateLevel,
        mutateProStatsLevel: mutateProStatsLevel,
        proStatsLevel: proStatsLevel,
        records: records,
        reviews: reviews,
        setSidebarIndex: setSidebarIndex,
        sidebarIndex: sidebarIndex,
      }}>
        <Page
          folders={folders}
          isFullScreen={true}
          subtitle={showSubtitle ? level.userId.name : undefined}
          subtitleHref={showSubtitle ? getProfileSlug(level.userId) : undefined}
          title={level.name ?? 'Loading...'}
        >
          {level.isDraft ? <></> :
            <GameWrapper
              chapter={chapter as string | undefined}
              collection={collection}
              level={level}
              onNext={() => changeLevel(true)}
              onPrev={() => changeLevel(false)}
              user={reqUser}
            />
          }
        </Page>
      </LevelContext.Provider>
    </>
  );
}
