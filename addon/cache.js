const get = Ember.get;

import LiveQuery from 'ember-orbit/live-query';
import { parseIdentifier } from 'orbit/lib/identifiers';
import Query from 'orbit/query';
import qb from 'orbit/query/builder';
import objectValues from 'ember-orbit/utils/object-values';

export default Ember.Object.extend({
  _orbitCache: null,
  _identityMap: null,

  init(...args) {
    this._super.apply(this, ...args);

    Ember.assert(get(this, '_orbitCache'), '_orbitCache is required');
    Ember.assert(get(this, '_identityMap'), '_identityMap is required');
  },

  includesRecord(type, id) {
    return this._orbitCache.has([type, id]);
  },

  retrieve(path) {
    return this._orbitCache.get(path);
  },

  retrieveRecord(type, id) {
    return this._identityMap.lookup({type, id});
  },

  retrieveKey(record, key) {
    return this.retrieve([record.type, record.id, 'keys', key]);
  },

  retrieveAttribute(record, attribute) {
    return this.retrieve([record.type, record.id, 'attributes', attribute]);
  },

  retrieveHasOne(record, relationship) {
    const value = this.retrieve([record.type, record.id, 'relationships', relationship, 'data']);
    if (!value) {
      return null;
    }

    return this._identityMap.lookup(parseIdentifier(value));
  },

  unload(record) {
    // console.debug('unload', record);
    this._identityMap.evict(record);
  },

  query(queryOrExpression) {
    const query = Query.from(queryOrExpression, this._orbitCache.queryBuilder);
    const result = this._orbitCache.query(query);

    switch(query.expression.op) {
      case 'record':
      case 'relatedRecord':
        return this._identityMap.lookup(result);
      case 'records':
      case 'relatedRecords':
      case 'filter':
        return this._identityMap.lookupMany(objectValues(result));
      default:
        return result;
    }
  },

  liveQuery(query) {
    return LiveQuery.create({
      _query: query,
      _orbitCache: this._orbitCache,
      _identityMap: this._identityMap
    });
  },

  find(type, id) {
    if (id === undefined) {
      return this.query(qb.records(type));
    } else {
      return this.query(qb.record({type, id}));
    }
  }
});
