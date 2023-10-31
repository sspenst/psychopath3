import Dimensions from '@root/constants/dimensions';
import { MusicContext } from '@root/contexts/musicContext';
import { PageContext } from '@root/contexts/pageContext';
import useDeviceCheck, { ScreenSize } from '@root/hooks/useDeviceCheck';
import { CollectionType } from '@root/models/constants/collection';
import SelectOptionStats from '@root/models/selectOptionStats';
import classNames from 'classnames';
import Link from 'next/link';
import React, { useContext, useEffect, useState } from 'react';
import Collection from '../../models/db/collection';
import { EnrichedLevel } from '../../models/db/level';
import User from '../../models/db/user';
import SelectCard from '../cards/selectCard';
import Modal from '../modal';
import PostGameModal from '../modal/postGameModal';
import Game from './game';
import FormattedLevelInfo from './info/formattedLevelInfo';

interface GameWrapperProps {
  chapter?: string;
  collection: Collection | undefined;
  level: EnrichedLevel;
  onNext: () => void;
  onPrev: () => void;
  user: User | null;
}

export default function GameWrapper({ chapter, collection, level, onNext, onPrev, user }: GameWrapperProps) {
  const [collectionViewHidden, setCollectionViewHidden] = useState(false);
  const [dontShowPostGameModal, setDontShowPostGameModal] = useState(false);
  const { isDynamic, isDynamicSupported, toggleVersion } = useContext(MusicContext);
  const [mutePostGameModalForThisLevel, setMutePostGameModalForThisLevel] = useState(false);
  const [postGameModalOpen, setShowPostGameModalOpen] = useState(false);
  const { setPreventKeyDownEvent } = useContext(PageContext);
  const { screenSize } = useDeviceCheck();
  const [showCollectionViewModal, setShowCollectionViewModal] = useState(false);

  useEffect(() => {
    const storedPref = localStorage.getItem('dontShowPostGameModal');
    const storedPrefExpire = localStorage.getItem(
      'dontShowPostGameModalExpire'
    );

    if (storedPrefExpire && new Date(storedPrefExpire) < new Date()) {
      localStorage.removeItem('dontShowPostGameModal');
      localStorage.removeItem('dontShowPostGameModalExpire');

      return;
    }

    if (storedPref === 'true') {
      setDontShowPostGameModal(true);
    }
  }, [level._id]);

  useEffect(() => {
    setMutePostGameModalForThisLevel(false);
  }, [level._id]);

  useEffect(() => {
    if (collection || showCollectionViewModal) {
      // scroll the collection list to the current level
      setTimeout(() => {
        const anchorId = level._id.toString() + '-collection-list';
        const anchor = document.getElementById(anchorId);

        if (anchor) {
          anchor.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest',
          });
        }
      }, screenSize <= ScreenSize.MD ? 300 : 0); // delay 300ms to allow the collection list to render in the modal view
    }
  }, [level._id, collection, showCollectionViewModal, screenSize]);

  const collectionLevelTitle = collection && (
    <Link className='text-xl font-bold hover:underline w-fit' href={'/collection/' + collection.slug}>
      {collection.name}
    </Link>
  );

  const collectionLevelList = collection && (<>
    {collection.levels.map((levelInCollection) => {
      let customStyle = {};

      if (level._id.toString() === levelInCollection._id.toString()) {
        customStyle = {
          border: '2px solid var(--color)',
          borderRadius: '4px',
          padding: '4px',
          margin: '4px',
          backgroundColor: 'var(--bg-color-2)',
          boxShadow: '0 0 0 2px var(--color)',
        };
      }

      const anchorId = levelInCollection._id.toString() + '-collection-list';

      return (
        <div key={anchorId} id={anchorId}>
          <SelectCard
            option={{
              author: levelInCollection.userId?.name,
              height: Dimensions.OptionHeightLarge,
              id: levelInCollection._id.toString(),
              level: levelInCollection,
              text: levelInCollection.name,
              stats: new SelectOptionStats(levelInCollection.leastMoves, (levelInCollection as EnrichedLevel)?.userMoves),
              hideAddToPlayLaterButton: collection.type !== CollectionType.PlayLater,
              customStyle: customStyle,
              href:
            '/level/' +
            levelInCollection.slug +
            '?cid=' +
            collection._id.toString(),
            }}
          />
        </div>
      );
    })}
  </>);

  return (
    <div className='flex h-full'>
      {screenSize < ScreenSize.XL && collection && (
        <button className='absolute right-0 pt-1 pr-1' onClick={() => {
          setShowCollectionViewModal(true);
          setPreventKeyDownEvent(true);
        }} >
          <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='currentColor' className='bi bi-list-ol' viewBox='0 0 16 16'>
            <path fillRule='evenodd' d='M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5z' />
            <path d='M1.713 11.865v-.474H2c.217 0 .363-.137.363-.317 0-.185-.158-.31-.361-.31-.223 0-.367.152-.373.31h-.59c.016-.467.373-.787.986-.787.588-.002.954.291.957.703a.595.595 0 0 1-.492.594v.033a.615.615 0 0 1 .569.631c.003.533-.502.8-1.051.8-.656 0-1-.37-1.008-.794h.582c.008.178.186.306.422.309.254 0 .424-.145.422-.35-.002-.195-.155-.348-.414-.348h-.3zm-.004-4.699h-.604v-.035c0-.408.295-.844.958-.844.583 0 .96.326.96.756 0 .389-.257.617-.476.848l-.537.572v.03h1.054V9H1.143v-.395l.957-.99c.138-.142.293-.304.293-.508 0-.18-.147-.32-.342-.32a.33.33 0 0 0-.342.338v.041zM2.564 5h-.635V2.924h-.031l-.598.42v-.567l.629-.443h.635V5z' />
          </svg>
        </button>
      )}
      <Game
        allowFreeUndo={true}
        disablePlayAttempts={!user}
        disableStats={!user}
        enableSessionCheckpoint={true}
        key={`game-${level._id.toString()}`}
        level={level}
        onNext={collection ? onNext : undefined}
        onPrev={collection ? onPrev : undefined}
        onSolve={() => {
          if (isDynamicSupported && isDynamic) {
            toggleVersion('hot');
          }

          if (!dontShowPostGameModal && !mutePostGameModalForThisLevel) {
            setTimeout(() => {
              setShowPostGameModalOpen(true);
              setMutePostGameModalForThisLevel(true);
              setPreventKeyDownEvent(true);
            }, 200);
          }
        }}
      />
      {screenSize >= ScreenSize.XL && <>
        {collection && !collectionViewHidden &&
          <div className={classNames('flex flex-col items-center gap-2 overflow-y-auto px-4 py-3 border-l border-color-4', collectionViewHidden && 'hidden')}>
            <div className='flex justify-between w-56 gap-2 items-center'>
              {collectionLevelTitle}
              <button onClick={() => setCollectionViewHidden(!collectionViewHidden)}>
                <svg className='w-5 h-5 hover:opacity-100 opacity-50' fill='currentColor' viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'>
                  <path fillRule='evenodd' d='M6 8a.5.5 0 0 0 .5.5h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L12.293 7.5H6.5A.5.5 0 0 0 6 8Zm-2.5 7a.5.5 0 0 1-.5-.5v-13a.5.5 0 0 1 1 0v13a.5.5 0 0 1-.5.5Z' />
                </svg>
              </button>
            </div>
            {collectionLevelList}
          </div>
        }
        <div className='border-l border-color-4 break-words z-10 h-full w-100 overflow-y-auto'>
          {collection && collectionViewHidden &&
            <button
              className='flex items-center gap-4 w-full border-b border-color-4 hover-bg-3 transition px-4 py-3'
              onClick={() => {
                if (setCollectionViewHidden) {
                  setCollectionViewHidden(!collectionViewHidden);
                }
              }}
            >
              <svg className='w-5 h-5 hover:opacity-100 opacity-50' fill='currentColor' viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg' style={{ minWidth: 20, minHeight: 20 }}>
                <path fillRule='evenodd' d='M12.5 15a.5.5 0 0 1-.5-.5v-13a.5.5 0 0 1 1 0v13a.5.5 0 0 1-.5.5ZM10 8a.5.5 0 0 1-.5.5H3.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L3.707 7.5H9.5a.5.5 0 0 1 .5.5Z' />
              </svg>
              <span className='text-left'>Expand <span className='font-bold'>{collection.name}</span> collection</span>
            </button>
          }
          <div className='px-4 py-3'>
            <FormattedLevelInfo level={level} />
          </div>
        </div>
      </>}
      <Modal
        isOpen={showCollectionViewModal}
        closeModal={() => {
          setShowCollectionViewModal(false);
          setPreventKeyDownEvent(false);
        }}
        title={collectionLevelTitle}
      >
        {collectionLevelList}
      </Modal>
      <PostGameModal
        chapter={chapter}
        closeModal={() => {
          setShowPostGameModalOpen(false);
          setPreventKeyDownEvent(false);
        }}
        collection={collection}
        dontShowPostGameModal={dontShowPostGameModal}
        isOpen={postGameModalOpen}
        level={level}
        reqUser={user}
        setDontShowPostGameModal={setDontShowPostGameModal}
      />
    </div>
  );
}
