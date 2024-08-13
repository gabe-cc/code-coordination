import { ObjectId as ObjectIdRaw } from './objectid' ;
import type { ObjectId as ObjectIdMongo } from 'mongodb' ;
const ObjectIdInternal = class extends ObjectIdRaw implements ObjectIdMongo {
}
export const ObjectId = ObjectIdInternal as typeof ObjectIdMongo
export type ObjectId = ObjectIdMongo