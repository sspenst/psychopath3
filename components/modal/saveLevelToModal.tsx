import { bringToTop } from '@root/helpers/bringToTop';
import { CollectionType } from '@root/models/CollectionEnums';
import Link from 'next/link';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AppContext } from '../../contexts/appContext';
import naturalSort from '../../helpers/naturalSort';
import { CollectionWithLevel } from '../../models/db/collection';
import Level from '../../models/db/level';
import StyledTooltip from '../page/styledTooltip';
import Modal from '.';

interface SaveLevelToModalProps {
  closeModal: () => void;
  isOpen: boolean;
  level: Level;
}

export default function SaveLevelToModal({ closeModal, isOpen, level }: SaveLevelToModalProps) {
  const [collections, setCollections] = useState<CollectionWithLevel[]>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { shouldAttemptAuth, user } = useContext(AppContext);

  const getCollections = useCallback(() => {
    if (isOpen && shouldAttemptAuth) {
      fetch(`/api/collections?id=${level._id.toString()}`, {
        method: 'GET',
      }).then(async res => {
        if (res.status === 200) {
          const collectionsWithLevel = bringToTop(naturalSort(await res.json()), { type: CollectionType.PlayLater }) as CollectionWithLevel[];

          setCollections(collectionsWithLevel);
        } else {
          throw res.text();
        }
      }).catch(err => {
        console.error(err);
      });
    }
  }, [isOpen, level._id, shouldAttemptAuth]);

  useEffect(() => {
    getCollections();
  }, [getCollections]);

  function onSubmit() {
    setIsSubmitting(true);
    toast.dismiss();
    toast.loading('Saving...');

    const collectionIds = collections?.filter(c => c.containsLevel).map(c => c._id.toString()) ?? [];

    fetch(`/api/save-level-to/${level._id}`, {
      method: 'PUT',
      body: JSON.stringify({
        collectionIds: collectionIds,
      }),
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(async res => {
      if (res.status !== 200) {
        throw res.text();
      }

      toast.dismiss();
      toast.success('Saved');
      closeModal();
    }).catch(async err => {
      console.error(err);
      toast.dismiss();
      toast.error(JSON.parse(await err)?.error);
    }).finally(() => {
      setIsSubmitting(false);
    });
  }

  function onCollectionIdChange(e: React.ChangeEvent<HTMLInputElement>) {
    const collectionId = e.currentTarget.value;

    setCollections(prevCollections => {
      const newCollections = JSON.parse(JSON.stringify(prevCollections));

      for (const collection of newCollections) {
        if (collection._id.toString() === collectionId) {
          collection.containsLevel = !collection.containsLevel;
        }
      }

      return newCollections;
    });
  }

  if (!user) {
    return null;
  }

  return (
    <Modal
      closeModal={closeModal}
      disabled={isSubmitting}
      isOpen={isOpen}
      onSubmit={onSubmit}
      title='Save Level To...'
    >
      <div className='flex flex-col gap-3'>
        {!collections ?
          <div>Loading...</div>
          :
          collections.length === 0 ?
            <>
              <span className='text-center text-xl'>You do not have any collections.</span>
              <span className='text-center text-sm'><span className='font-bold'>Collections</span> are lists of levels. They are a great way to organize and share level series, favorites, or to the group levels that you have created,.</span>
              {user && <Link href={`/profile/${user.name}/collections` } className='text-center bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline cursor-pointer'>Create your first collection</Link>}
            </>
            :
            <div className='flex flex-col gap-1'>
              {collections.map(collection => {
                const collectionId = collection._id.toString();
                const key = `collection-${collectionId}`;

                return (
                  <div className='flex flex-row gap-2' key={key}>
                    <input
                      checked={collection.containsLevel}
                      id={key}
                      onChange={onCollectionIdChange}
                      type='checkbox'
                      value={collectionId}
                    />
                    <label className='truncate' htmlFor={key}>{collection.name}</label>
                    {collection.isPrivate &&
                      <div data-tooltip-offset={0} data-tooltip-content={'Private'} data-tooltip-id={'private-tooltip-' + collectionId}><svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' className='w-6 h-6'>
                        <path strokeLinecap='round' strokeLinejoin='round' d='M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z' />
                      </svg>
                      <StyledTooltip id={'private-tooltip-' + collectionId} />
                      </div>
                    }
                  </div>
                );
              })}
            </div>
        }
        <Link href={`/profile/${user.name}/collections`} className='italic hover:underline w-fit'>+ Create a collection</Link>
      </div>
    </Modal>
  );
}
