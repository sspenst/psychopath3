import { Menu } from '@headlessui/react';
import FormattedUser from '@root/components/formatted/formattedUser';
import RecommendedLevel from '@root/components/homepage/recommendedLevel';
import MultiSelectLevel from '@root/components/page/multiSelectLevel';
import MultiSelectUser from '@root/components/page/multiSelectUser';
import Page from '@root/components/page/page';
import Role from '@root/constants/role';
import useLevelBySlug from '@root/hooks/useLevelBySlug';
import dbConnect from '@root/lib/dbConnect';
import { getUserFromToken } from '@root/lib/withAuth';
import Level from '@root/models/db/level';
import User from '@root/models/db/user';
import { LevelModel, UserModel } from '@root/models/mongoose';
import { Types } from 'mongoose';
import { GetServerSidePropsContext, NextApiRequest } from 'next';
import Router from 'next/router';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export async function getServerSideProps(context: GetServerSidePropsContext) {
  await dbConnect();

  const token = context.req?.cookies?.token;
  const reqUser = token ? await getUserFromToken(token, context.req as NextApiRequest) : null;

  if (!reqUser || !reqUser.roles.includes(Role.ADMIN)) {
    return {
      notFound: true,
    };
  }

  const { queryUser, queryLevel, queryUserCommand, queryLevelCommand } = context.query;

  return {
    props: {
      queryLevel: queryLevel && queryLevel !== 'undefined' ? JSON.parse(JSON.stringify(await LevelModel.findById(new Types.ObjectId(queryLevel as string)))) : null,
      queryUser: queryUser && queryUser !== 'undefiend' ? JSON.parse(JSON.stringify(await UserModel.findOne({ name: queryUser }))) : null,
      queryUserCommand: queryUserCommand || null,
      queryLevelCommand: queryLevelCommand || null,
    },
  };
}

export default function AdminPage({ queryUser, queryLevel, queryUserCommand, queryLevelCommand }: {queryUser: User | undefined; queryLevel: Level, queryUserCommand: string | null, queryLevelCommand: string | null}) {
  const [selectedUser, setSelectedUser] = useState(queryUser);
  const [selectedLevel, setSelectedLevel] = useState(queryLevel); // TODO: [refactor] [minor
  const [runningCommand, setRunningCommand] = useState(false);

  const commandsUser = [
    { label: 'Refresh Achievements', command: 'refreshAchievements' },
    { label: 'Delete Achievements', command: 'deleteAchievements', confirm: true },

    // Add more commands here
  ];

  const commandsLevel = [
    { label: 'Refresh Play Attempts', command: 'calcPlayAttempts' },
    { label: 'Refresh Index Calculations', command: 'refreshIndexCalcs' },
  ];
  const selectedUserCommandFromQuery = commandsUser.find((cmd) => cmd.command === queryUserCommand);

  const [selectedUserCommand, setSelectedUserCommand] = useState<{ label: string; command: string; confirm?: boolean } | null>(selectedUserCommandFromQuery || null);

  const selectedLevelCommandFromQuery = commandsLevel.find((cmd) => cmd.command === queryLevelCommand);

  const [selectedLevelCommand, setSelectedLevelCommand] = useState<{ label: string; command: string; confirm?: boolean } | null>(selectedLevelCommandFromQuery || null);

  const { level: levelPreview } = useLevelBySlug(selectedLevel?.slug);

  useEffect(() => {
    const newUrl = `${window.location.pathname}?queryLevel=${selectedLevel?._id}&queryLevelCommand=${selectedLevelCommand?.command}&queryUser=${selectedUser?.name}&queryUserCommand=${selectedUserCommand?.command}`;

    const currentFullURL = `${window.location.pathname}${window.location.search}`;

    if (currentFullURL !== newUrl) {
      Router.push(newUrl);
    }
  }, [selectedUser, selectedUserCommand, selectedLevel?._id, selectedLevelCommand?.command]);

  async function runCommandUser() {
    if (selectedUserCommand?.confirm && !window.confirm('Are you sure you want to proceed?')) return;

    setRunningCommand(true);
    toast.dismiss();
    toast.loading('Running command...');
    const resp = await fetch('/api/admin', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        command: selectedUserCommand?.command,
        targetId: selectedUser?._id,
      }),
    });

    setRunningCommand(false);
    const json = await resp.json();

    if (json.error) {
      toast.error(json.error);
    } else {
      toast.success('Command ran successfully');
    }
  }

  async function runCommandLevel() {
    if (selectedLevelCommand?.confirm && !window.confirm('Are you sure you want to proceed?')) return;

    setRunningCommand(true);
    toast.dismiss();
    toast.loading('Running command...');
    const resp = await fetch('/api/admin', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        command: selectedLevelCommand?.command,
        targetId: selectedLevel?._id,
      }),
    });

    setRunningCommand(false);
    const json = await resp.json();

    if (json.error) {
      toast.error(json.error);
    } else {
      toast.success('Command ran successfully');
    }

    Router.reload();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function display(title: string, obj: any) {
    return (
      <div>
        <h1 className='text-2xl font-bold mb-4'>{title}</h1>
        {obj && (
          <div className='grid grid-cols-4 gap-4'>
            {Object.keys(obj).map((value) => {
              const key = value;
              const str = obj[key]?.toString() ?? '';

              return (
                <div key={key} className='flex items-center'>
                  <div className='flex-none font-bold pr-2'>
                    <label>{key}:</label>
                  </div>
                  <div className='flex-grow'>
                    <input
                      type='text'
                      readOnly
                      value={str}
                      onClick={(e) => {
                        (e.target as HTMLInputElement).select();
                        navigator.clipboard.writeText(str);
                      }}
                      className='text-black p-1 rounded-md w-full'
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <Page title='Admin Page'>

      <div className='p-2'>
        <h1 className='flex flex-col items-center justify-center text-3xl p-3'>Admin Page</h1>
        <h2 className='flex flex-col items-center justify-center text-2xl'>
            User
        </h2>
        <div className='flex flex-row items-center justify-center p-2 gap-2'>

          <p className='text-xl'>Run command on user:</p>
          <MultiSelectUser key={'search-' + selectedUser?._id} defaultValue={selectedUser} onSelect={(selected: User) => {
            setSelectedUser(selected);
          }} />
          <Menu as='div' className='relative inline-block text-left'>
            <div>
              <Menu.Button className='border border-gray-300 bg-gray rounded-md shadow-sm px-4 py-2 text-sm flex flex-row items-center justify-center gap-2'>
                {selectedUserCommand?.label || 'Select Command'}
              </Menu.Button>
            </div>
            <Menu.Items className='origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5'>
              {commandsUser.map((cmd) => (
                <Menu.Item key={cmd.command}>
                  {({ active }) => (
                    <a
                      onClick={() => {
                        setSelectedUserCommand(cmd);
                      }}
                      className={`${active ? 'bg-blue-600 text-white' : 'text-gray-900'} block px-4 py-2 text-sm`}
                    >
                      {cmd.label}
                    </a>
                  )}
                </Menu.Item>
              ))}
            </Menu.Items>
          </Menu>
          <button
            className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ${runningCommand ? 'bg-gray-500 cursor-not-allowed' : ''}`}
            disabled={runningCommand}
            onClick={runCommandUser}
          >
            Run
          </button>
        </div>
        <div className='flex flex-row items-center justify-center p-2 gap-2'>
          <FormattedUser id='admin' user={selectedUser} />
        </div>
        <div className='flex flex-row items-center justify-center p-2 gap-2'>
          {selectedUser && (
            <div className='flex flex-col gap-2'>

              {display('User', selectedUser)}
            </div>
          )}
        </div>

        <h2 className='flex flex-col items-center justify-center text-2xl'>
          Level</h2>
        <div className='flex flex-row items-center justify-center p-2 gap-2'>
          <p className='text-xl'>Run command on level:</p>
          <MultiSelectLevel key={'search-' + selectedLevel?._id} defaultValue={selectedLevel} onSelect={(selected: Level) => {
            setSelectedLevel(selected);
          }} />
          <Menu as='div' className='relative inline-block text-left'>
            <div>
              <Menu.Button className='border border-gray-300 bg-gray rounded-md shadow-sm px-4 py-2 text-sm flex flex-row items-center justify-center gap-2'>
                {selectedLevelCommand?.label || 'Select Command'}
              </Menu.Button>
            </div>
            <Menu.Items className='origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5'>
              {commandsLevel.map((cmd) => (
                <Menu.Item key={cmd.command}>
                  {({ active }) => (
                    <a
                      onClick={() => {
                        setSelectedLevelCommand(cmd);
                      }}
                      className={`${active ? 'bg-blue-600 text-white' : 'text-gray-900'} block px-4 py-2 text-sm`}
                    >
                      {cmd.label}
                    </a>
                  )}
                </Menu.Item>
              ))}
            </Menu.Items>
          </Menu>
          <button
            className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ${runningCommand ? 'bg-gray-500 cursor-not-allowed' : ''}`}
            disabled={runningCommand}
            onClick={runCommandLevel}
          >
            Run
          </button>

        </div>

        <div className='flex flex-col items-center justify-center p-2 gap-2'>
          <RecommendedLevel id='level' title='' level={levelPreview} />
        </div>
        <div className='flex flex-row items-center justify-center p-2 gap-2'>
          {selectedLevel && (
            <div className='flex flex-col gap-2'>

              {display('Level', selectedLevel)}
            </div>
          )}
        </div>
      </div>

    </Page>
  );
}
