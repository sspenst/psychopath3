import { Types } from 'mongoose';
import NProgress from 'nprogress';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { throttle } from 'throttle-debounce';
import LevelDataType from '../../constants/levelDataType';
import { AppContext } from '../../contexts/appContext';
import { LevelContext } from '../../contexts/levelContext';
import { PageContext } from '../../contexts/pageContext';
import BlockState from '../../models/blockState';
import Control from '../../models/control';
import Level from '../../models/db/level';
import Move from '../../models/move';
import Position, { getDirectionFromCode } from '../../models/position';
import SquareState from '../../models/squareState';
import GameLayout from './gameLayout';

export interface GameState {
  actionCount: number;
  blocks: BlockState[];
  board: SquareState[][];
  height: number;
  moveCount: number;
  moves: Move[];
  pos: Position;
  width: number;
}

interface GameStateStorage {
  _id: Types.ObjectId;
  gameState: GameState;
}

interface GameProps {
  allowFreeUndo?: boolean;
  disablePlayAttempts?: boolean;
  disableStats?: boolean;
  enableLocalSessionRestore?: boolean;
  extraControls?: Control[];
  hideSidebar?: boolean;
  level: Level;
  matchId?: string;
  onComplete?: () => void;
  onMove?: (gameState: GameState) => void;
  onNext?: () => void;
  onPrev?: () => void;
  onStatsSuccess?: () => void;
}

function cloneGameState(state: GameState) {
  return {
    actionCount: 0,
    blocks: state.blocks.map(block => BlockState.clone(block)),
    board: state.board.map(row => {
      return row.map(square => SquareState.clone(square));
    }),
    height: state.height,
    moveCount: state.moveCount,
    moves: state.moves.map(move => Move.clone(move)),
    pos: new Position(state.pos.x, state.pos.y),
    width: state.width,
  };
}

export default function Game({
  allowFreeUndo,
  disablePlayAttempts,
  disableStats,
  enableLocalSessionRestore,
  extraControls,
  hideSidebar,
  level,
  matchId,
  onComplete,
  onMove,
  onNext,
  onPrev,
  onStatsSuccess,
}: GameProps) {
  const [lastCodes, setLastCodes] = useState<string[]>([]);
  const levelContext = useContext(LevelContext);
  const [localSessionRestored, setLocalSessionRestored] = useState(false);
  const mutateLevel = levelContext?.mutateLevel;
  const { mutateUser, shouldAttemptAuth } = useContext(AppContext);
  const { preventKeyDownEvent } = useContext(PageContext);
  const r = useRef(Date.now());

  const initGameState: (actionCount?: number) => GameState = useCallback((actionCount = 0) => {
    const blocks: BlockState[] = [];
    const height = level.height;
    const width = level.width;
    const board = Array(height).fill(undefined).map(() =>
      new Array(width).fill(undefined).map(() =>
        new SquareState()));
    const data = level.data.split('\n');
    let blockId = 0;
    let pos = new Position(0, 0);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const levelDataType = data[y][x];

        if (levelDataType === LevelDataType.Wall ||
          levelDataType === LevelDataType.End ||
          levelDataType === LevelDataType.Hole) {
          board[y][x].levelDataType = levelDataType;
        } else if (levelDataType === LevelDataType.Start) {
          pos = new Position(x, y);
        } else if (LevelDataType.canMove(levelDataType)) {
          blocks.push(new BlockState(blockId++, levelDataType, x, y));
        }
      }
    }

    return {
      actionCount: actionCount,
      blocks: blocks,
      board: board,
      height: height,
      moveCount: 0,
      moves: [],
      pos: pos,
      width: width,
    };
  }, [level.data, level.height, level.width]);

  const [gameState, setGameState] = useState<GameState>(initGameState());
  const oldGameState = useRef<GameState>();
  const currentStepDisplay = useRef<number>(0);

  // NB: need to reset the game state if SWR finds an updated level
  useEffect(() => {
    setGameState(initGameState());
  }, [initGameState]);

  useEffect(() => {
    if (enableLocalSessionRestore && !localSessionRestored && typeof window.sessionStorage !== 'undefined') {
      const levelSessionStorage = window.sessionStorage.getItem('level');

      if (levelSessionStorage) {
        const gameStateStorage = JSON.parse(levelSessionStorage) as GameStateStorage;

        if (gameStateStorage._id === level._id && gameStateStorage.gameState) {
          const gameStateLocal = cloneGameState(gameStateStorage.gameState);

          setGameState(prevGameState => {
            // Compare local game state with server game state
            const isEqual = prevGameState.board.length === gameStateLocal.board.length &&
              prevGameState.height === gameStateLocal.height &&
              prevGameState.width === gameStateLocal.width &&
              prevGameState.blocks.every((serverBlock, i) => {
                const localBlock = gameStateLocal.blocks[i];

                return serverBlock.type === localBlock.type;
              });

            if (isEqual) {
              setLocalSessionRestored(true);

              return gameStateLocal;
            } else {
              // this happens... super weird... but at least we catch it now
              return prevGameState;
            }
          });
        }
      }
    }
  }, [enableLocalSessionRestore, level._id, level.ts, localSessionRestored]);

  useEffect(() => {
    if (gameState.actionCount > 0) {
      if (onMove) {
        onMove(gameState);
      }

      if (enableLocalSessionRestore && typeof window.sessionStorage !== 'undefined') {
        window.sessionStorage.setItem('level', JSON.stringify({
          _id: level._id,
          gameState: gameState,
        } as GameStateStorage));
      }
    }
  }, [enableLocalSessionRestore, gameState, level._id, level.ts, onMove]);

  const SECOND = 1000;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchPlayAttempt = useCallback(throttle(15 * SECOND, async () => {
    if (shouldAttemptAuth) {
      await fetch('/api/play-attempt', {
        body: JSON.stringify({
          levelId: level._id,
          matchId: matchId, // TODO, add this as a tag in playAttempt so we can filter by matches
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });
    }
  }), []);

  useEffect(() => {
    if (disablePlayAttempts || gameState.actionCount === 0) {
      return;
    }

    fetchPlayAttempt();
  }, [disablePlayAttempts, fetchPlayAttempt, gameState.actionCount]);

  const trackStats = useCallback((codes: string[], levelId: string, maxRetries: number) => {
    console.log('trackStats START');

    if (disableStats) {
      console.log('trackStats SERVER DISABLED');

      return;
    }

    // if codes array is identical to lastCodes array, don't PUT stats
    if (codes.length === lastCodes.length && codes.every((code, index) => code === lastCodes[index])) {
      console.log('we\'ve got identical codes, aborting ', codes.length, lastCodes.length, codes, lastCodes);

      return;
    }

    NProgress.start();

    console.log('CALLING PUT STATS');
    fetch('/api/stats', {
      method: 'PUT',
      body: JSON.stringify({
        codes: codes,
        levelId: levelId,
        matchId: matchId,
      }),
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
    }).then(async res => {
      if (res.status === 200) {
        mutateUser();
        console.log('trackStats 200');

        if (mutateLevel) {
          mutateLevel();
        }

        if (onStatsSuccess) {
          onStatsSuccess();
        }

        setLastCodes(codes);
      } else if (res.status === 500) {
        throw res.text();
      } else {
        // NB: don't retry if we get a 400 or 404 response since the request is already invalid
        const error = JSON.parse(await res.text())?.error;

        toast.dismiss();
        toast.error(`Error updating stats: ${error}`, { duration: 3000 });
      }
    }).catch(async err => {
      const error = JSON.parse(await err)?.error;

      console.error(`Error updating stats: { codes: ${codes}, levelId: ${levelId} }`, error);
      toast.dismiss();
      toast.error(`Error updating stats: ${error}`, { duration: 3000 });

      if (maxRetries > 0) {
        trackStats(codes, levelId, maxRetries - 1);
      }
    }).finally(() => {
      NProgress.done();
    });
    console.log('trackStats END');
  }, [disableStats, lastCodes, matchId, mutateLevel, mutateUser, onStatsSuccess]);

  const handleKeyDown = useCallback((code: string) => {
    // boundary checks
    function isPositionValid(
      height: number,
      pos: Position,
      width: number,
    ) {
      return pos.x >= 0 && pos.x < width && pos.y >= 0 && pos.y < height;
    }

    // can the player move to this position
    function isPlayerPositionValid(
      board: SquareState[][],
      height: number,
      pos: Position,
      width: number,
    ) {
      return isPositionValid(height, pos, width) && board[pos.y][pos.x].levelDataType !== LevelDataType.Wall &&
        board[pos.y][pos.x].levelDataType !== LevelDataType.Hole;
    }

    // can a block move to this position
    function isBlockPositionValid(
      board: SquareState[][],
      blocks: BlockState[],
      height: number,
      pos: Position,
      width: number,
    ) {
      return isPositionValid(height, pos, width) && board[pos.y][pos.x].levelDataType !== LevelDataType.Wall &&
        !isBlockAtPosition(blocks, pos);
    }

    function getBlockById(blocks: BlockState[], id: number) {
      for (let i = 0; i < blocks.length; i++) {
        if (blocks[i].id === id) {
          return blocks[i];
        }
      }

      return undefined;
    }

    function getBlockIndexAtPosition(blocks: BlockState[], pos: Position) {
      for (let i = 0; i < blocks.length; i++) {
        // ignore blocks in hole
        if (blocks[i].inHole) {
          continue;
        }

        if (blocks[i].pos.equals(pos)) {
          return i;
        }
      }

      return -1;
    }

    function isBlockAtPosition(blocks: BlockState[], pos: Position) {
      return getBlockIndexAtPosition(blocks, pos) !== -1;
    }

    setGameState(prevGameState => {
      function getNewGameState() {
        // restart
        if (code === 'KeyR') {
          if (prevGameState.moveCount > 0) {
            oldGameState.current = cloneGameState(prevGameState);
          }

          return initGameState(prevGameState.actionCount + 1);
        }

        // treat prevGameState as immutable
        const blocks = prevGameState.blocks.map(block => block.clone());
        const board = prevGameState.board.map(row => {
          return row.map(square => square.clone());
        });
        const moves = prevGameState.moves.map(move => move.clone());

        // undo
        function undo() {
          const prevMove = moves.pop();

          // nothing to undo
          if (prevMove === undefined) {
            let returnState = undefined;

            if (oldGameState.current) {
              returnState = cloneGameState(oldGameState.current);
            }

            oldGameState.current = undefined;

            return returnState || prevGameState;
          }

          // remove text only from the current position for smoother animations
          const text = board[prevGameState.pos.y][prevGameState.pos.x].text;

          // the text may not exist since it is only added when moving away from a position
          if (text[text.length - 1] === prevGameState.moveCount) {
            text.pop();
          }

          if (prevMove.block) {
            const block = getBlockById(blocks, prevMove.block.id);

            if (block) {
              block.pos = prevMove.block.pos.clone();

              if (block.inHole) {
                block.inHole = false;

                if (prevMove.holePos !== undefined) {
                  board[prevMove.holePos.y][prevMove.holePos.x].levelDataType = LevelDataType.Hole;
                }
              }
            }
          }

          currentStepDisplay.current = moves.length;

          return {
            actionCount: prevGameState.actionCount + 1,
            blocks: blocks,
            board: board,
            height: prevGameState.height,
            moveCount: prevGameState.moveCount - 1,
            moves: moves,
            pos: prevMove.pos.clone(),
            width: prevGameState.width,
          };
        }

        function makeMove(direction: Position) {
          // if the position didn't change or the new position is invalid
          if (!isPlayerPositionValid(board, prevGameState.height, pos, prevGameState.width)) {
            return prevGameState;
          }

          const blockIndex = getBlockIndexAtPosition(blocks, pos);
          const move = new Move(code, prevGameState.pos);

          // if there is a block at the new position
          if (blockIndex !== -1) {
            const block = blocks[blockIndex];
            const blockPos = block.pos.add(direction);

            // if the block is not allowed to move this direction or the new position is invalid
            if (!block.canMoveTo(blockPos) ||
              !isBlockPositionValid(board, blocks, prevGameState.height, blockPos, prevGameState.width)) {
              return prevGameState;
            }

            move.block = block.clone();
            block.pos = blockPos;

            // remove block if it is pushed onto a hole
            if (board[blockPos.y][blockPos.x].levelDataType === LevelDataType.Hole) {
              block.inHole = true;
              board[blockPos.y][blockPos.x].levelDataType = LevelDataType.Default;
              move.holePos = blockPos.clone();
            }
          }

          const text = board[prevGameState.pos.y][prevGameState.pos.x].text;

          // save text if it doesn't already exist (may exist due to undo)
          if (text[text.length - 1] !== prevGameState.moveCount) {
            text.push(prevGameState.moveCount);
          }

          // save history from this move
          moves.push(move);

          const moveCount = prevGameState.moveCount + 1;

          if (board[pos.y][pos.x].levelDataType === LevelDataType.End) {
            trackStats(moves.map(move => move.code), level._id.toString(), 3);
          }

          return {
            actionCount: prevGameState.actionCount + 1,
            blocks: blocks,
            board: board,
            height: prevGameState.height,
            moveCount: moveCount,
            moves: moves,
            pos: pos,
            width: prevGameState.width,
          };
        }

        // if explicitly asked to undo, undo
        if (code === 'Backspace' || code === 'KeyU' || code == 'KeyZ') {
          return undo();
        }

        const direction = getDirectionFromCode(code);

        // return if no valid direction was pressed
        if (!direction) {
          return prevGameState;
        }

        // calculate the target tile to move to
        const pos = prevGameState.pos.add(direction);

        // before making a move, check if undo is a better choice
        function checkForFreeUndo() {
          if (moves.length === 0) {
            return false;
          }

          // logic for valid free undo:
          //  if the board state has not changed and you're backtracking
          const lastMove = moves[moves.length - 1];

          return pos.equals(lastMove.pos) && !lastMove.block;
        }

        if (allowFreeUndo && checkForFreeUndo()) {
          return undo();
        }

        // lock movement once you reach the finish
        if (prevGameState.board[prevGameState.pos.y][prevGameState.pos.x].levelDataType === LevelDataType.End) {
          return prevGameState;
        }

        // if not, just make the move normally
        return makeMove(direction);
      }

      const newGameState = getNewGameState();

      if (newGameState.board[newGameState.pos.y][newGameState.pos.x].levelDataType === LevelDataType.End &&
        newGameState.moves.length <= level.leastMoves && onComplete) {
        onComplete();
      }

      return newGameState;
    });
  }, [allowFreeUndo, initGameState, level._id, level.leastMoves, onComplete, trackStats]);

  const touchXDown = useRef<number>(0);
  const touchYDown = useRef<number>(0);
  const validTouchStart = useRef<boolean>(false);
  const [lastTouchTimestamp, setLastTouchTimestamp] = useState<number>(Date.now());
  const lastMovetimestamp = useRef(Date.now());
  const isSwiping = useRef<boolean>(false);
  const handleKeyDownEvent = useCallback((event: KeyboardEvent) => {
    const curTime = Date.now();

    // // if it has been less than 15ms since the last key press, ignore this one
    if (curTime - r.current < 15) {
      console.log('[possible buggered] HandleKeyDownEvent returning early ', curTime - r.current);

      return;
    }

    r.current = curTime;

    if (preventKeyDownEvent) {
      return;
    }

    const { code } = event;

    // prevent arrow keys from scrolling the sidebar
    if (code === 'ArrowUp' || code === 'ArrowDown') {
      event.preventDefault();
    }

    handleKeyDown(code);
  }, [handleKeyDown, preventKeyDownEvent]);

  const handleTouchStartEvent = useCallback((event: TouchEvent) => {
    if (preventKeyDownEvent) {
      return;
    }

    // NB: must start the touch event within the game layout
    const isValid = event.composedPath().some(e => (e as HTMLElement).id === 'grid');

    validTouchStart.current = isValid;

    if (isValid) {
      // store the mouse x and y position
      touchXDown.current = event.touches[0].clientX;
      touchYDown.current = event.touches[0].clientY;
      isSwiping.current = false;
      const ts = Date.now();

      setLastTouchTimestamp(ts);
      event.preventDefault();
    }
  }, [preventKeyDownEvent]);

  const moveByDXDY = useCallback((dx: number, dy: number) => {
    const timeSince = Date.now() - lastMovetimestamp.current;

    if (timeSince < 0) {
      // max move rate
      return;
    }

    lastMovetimestamp.current = Date.now();
    const code = Math.abs(dx) > Math.abs(dy) ? dx < 0 ?
      'ArrowLeft' : 'ArrowRight' : dy < 0 ? 'ArrowUp' : 'ArrowDown';

    handleKeyDown(code);
  }, [handleKeyDown, lastMovetimestamp]);

  const handleTouchMoveEvent = useCallback((event: TouchEvent) => {
    if (!validTouchStart.current || preventKeyDownEvent) {
      return;
    }

    const timeSince = Date.now() - lastTouchTimestamp;

    if (timeSince > 500) {
      isSwiping.current = false;
    }

    if (!isSwiping.current && touchXDown !== undefined && touchYDown !== undefined ) {
      const { clientX, clientY } = event.changedTouches[0];
      const dx: number = clientX - touchXDown.current;
      const dy: number = clientY - touchYDown.current;
      const containerDiv = document.getElementById('grid');

      const maxHeight = containerDiv?.offsetHeight || 0;
      const maxWidth = containerDiv?.offsetWidth || 0;
      const squareSize = gameState.width / gameState.height > maxWidth / maxHeight ?
        Math.floor(maxWidth / gameState.width) : Math.floor(maxHeight / gameState.height);

      const squareMargin = Math.round(squareSize / 40) || 1;

      // drag distance
      const dragDistance = Math.sqrt(dx * dx + dy * dy);

      if (dragDistance / timeSince > 0.3) {
        // if the user drags really fast and it was sudden, don't move on drag because it is likely a swipe
        touchXDown.current = clientX;
        touchYDown.current = clientY;
        isSwiping.current = true;

        return;
      }

      if (Math.abs(dx) < squareSize + squareMargin && Math.abs(dy) < squareSize + squareMargin) {
        return;
      }

      if (timeSince > 0) {
        touchXDown.current = clientX;
        touchYDown.current = clientY;
        moveByDXDY(dx, dy);
      }

      // reset x and y position
      // setTouchXDown(undefined);
      // setTouchYDown(undefined);
    }
  }, [gameState.height, gameState.width, lastTouchTimestamp, moveByDXDY, preventKeyDownEvent]);

  const handleTouchEndEvent = useCallback((event: TouchEvent) => {
    if (!validTouchStart.current || preventKeyDownEvent) {
      return;
    }

    const timeSince = Date.now() - lastTouchTimestamp;

    if (timeSince <= 500 && touchXDown !== undefined && touchYDown !== undefined) {
      // for swipe control instead of drag
      const { clientX, clientY } = event.changedTouches[0];

      const dx: number = clientX - touchXDown.current;
      const dy: number = clientY - touchYDown.current;

      if (Math.abs(dx) <= 0.5 && Math.abs(dy) <= 0.5) {
        // disable tap
        // get player
        const player = document.getElementById('player');

        if (!player) {
          return;
        }

        return;
      }

      moveByDXDY(dx, dy);
      touchXDown.current = clientX;
      touchYDown.current = clientY;
    }
  }, [lastTouchTimestamp, moveByDXDY, preventKeyDownEvent, touchXDown, touchYDown]);

  useEffect(() => {
    window.removeEventListener('keydown', handleKeyDownEvent, true);
    window.removeEventListener('touchstart', handleTouchStartEvent, true);
    window.removeEventListener('touchmove', handleTouchMoveEvent, true);
    window.removeEventListener('touchend', handleTouchEndEvent, true);
    //
    window.addEventListener('keydown', handleKeyDownEvent, true);
    window.addEventListener('touchstart', handleTouchStartEvent, true);
    window.addEventListener('touchmove', handleTouchMoveEvent, true);
    window.addEventListener('touchend', handleTouchEndEvent, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDownEvent, true);
      window.removeEventListener('touchstart', handleTouchStartEvent, true);
      window.removeEventListener('touchmove', handleTouchMoveEvent, true);
      window.removeEventListener('touchend', handleTouchEndEvent, true);
    };
  }, [handleKeyDownEvent, handleTouchMoveEvent, handleTouchStartEvent, handleTouchEndEvent]);

  const [controls, setControls] = useState<Control[]>([]);

  useEffect(() => {
    const _controls: Control[] = [];

    if (onPrev) {
      _controls.push(new Control('btn-prev', () => onPrev(), <>Prev Level</>));
    }

    _controls.push(
      new Control('btn-restart', () => handleKeyDown('KeyR'), <><span className='underline'>R</span>estart</>),
      new Control('btn-undo', () => { handleKeyDown('Backspace');

        if (currentStepDisplay.current === 1) {
        // @todo : This is a hacky hack but somehow it works
          return false;
        }

        return true;}, <><span className='underline'>U</span>ndo</>, false, false, () => {
        handleKeyDown('Backspace');

        if (currentStepDisplay.current === 1) {
          // @todo : This is a hacky hack but somehow it works
          return false;
        }

        return true;
      })
    );

    if (onNext) {
      _controls.push(new Control('btn-next', () => onNext(), <>Next Level</>));
    }

    if (extraControls) {
      setControls(_controls.concat(extraControls));
    } else {
      setControls(_controls);
    }
  }, [extraControls, gameState.moveCount, handleKeyDown, onNext, onPrev, setControls]);

  function onCellClick(x: number, y: number) {
    if (isSwiping.current) {
      return;
    }

    const playerPosition = gameState.pos;

    // if the position is one away from x,y then move the player
    if (Math.abs(playerPosition.x - x) + Math.abs(playerPosition.y - y) === 1) {
      moveByDXDY(x - playerPosition.x, y - playerPosition.y);
      validTouchStart.current = false;
    }
  }

  return (
    <GameLayout
      controls={controls}
      gameState={gameState}
      hideSidebar={hideSidebar}
      level={level}
      matchId={matchId}
      onCellClick={(x, y) => onCellClick(x, y)}
    />
  );
}
