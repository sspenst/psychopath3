import Level from '../models/db/level';

export default function cloneLevel(level: Level) {
  return {
    _id: level._id,
    authorNote: level.authorNote,
    data: level.data,
    height: level.height,
    isDraft: level.isDraft,
    leastMoves: level.leastMoves,
    name: level.name,
    officialUserId: level.officialUserId,
    points: level.points,
    psychopathId: level.psychopathId,
    ts: level.ts,
    userId: level.userId,
    width: level.width,
    worldId: level.worldId,
  };
}
