import Link from 'next/link';
import React, { useCallback } from 'react';
import toast from 'react-hot-toast';
import { throttle } from 'throttle-debounce';
import Collection from '../../models/db/collection';
import { EnrichedLevel } from '../../models/db/level';
import User from '../../models/db/user';
import PostGameModal from '../modal/postGameModal';
import DismissToast from '../toasts/dismissToast';
import styles from './Controls.module.css';
import Game from './game';

interface GameWrapperProps {
  collection: Collection | undefined;
  level: EnrichedLevel;
  onNext: () => void;
  onPrev: () => void;
  user: User | null;
}

export default function GameWrapper({ collection, level, onNext, onPrev, user }: GameWrapperProps) {
  const signUpToast = throttle(2500, () => {
    toast.dismiss();
    toast.success(
      <div className='flex'>
        <div>
          <h1 className='text-center text-2xl'>Good job!</h1>
          <h2 className='text-center text-sm'>But your progress isn&apos;t saved...</h2>
          <div className='text-center'>
            <Link href='/signup' className='underline font-bold'>Sign up</Link> (free) to save your progress and get access to more features.
          </div>
        </div>
        <DismissToast />
      </div>
      ,
      {
        duration: 10000,
        icon: '🎉',
      });
  });

  const [postGameModalOpen, setShowPostGameModalOpen] = React.useState(false);

  const addNextButtonHighlight = useCallback(() => {
    // find <button> with id 'btn-next'
    const nextButton = document.getElementById('btn-next') as HTMLButtonElement;

    // add css style to have it blink
    nextButton?.classList.add(styles['highlight-once']);
    setTimeout(() => {
      nextButton?.classList.remove(styles['highlight-once']);
    }, 1300);
  }, []);

  return (
    <>
      {user && (
        <PostGameModal collection={collection} reqUser={user} isOpen={postGameModalOpen} level={level} closeModal={() => {
          setShowPostGameModalOpen(false);
        }}
        />
      )}
      <Game
        allowFreeUndo={true}
        disablePlayAttempts={!user}
        disableStats={!user}
        enableSessionCheckpoint={true}
        key={`game-${level._id.toString()}`}
        level={level}
        onSolve={() => {
          if (!user) {
            signUpToast();
          }

          if (collection) {
            addNextButtonHighlight();
          }

          console.log('onSolve');
          setShowPostGameModalOpen(true);
        }}
        onNext={collection ? onNext : undefined}
        onPrev={collection ? onPrev : undefined}
      />
    </>
  );
}
