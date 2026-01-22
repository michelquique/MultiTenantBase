// Cliente para MongoDB Atlas Data API (compatible con Cloudflare Workers)
export class MongoDBAtlas {
  constructor(env) {
    this.apiKey = env.MONGODB_DATA_API_KEY;
    this.appId = env.MONGODB_APP_ID;
    this.baseUrl = `https://data.mongodb-api.com/app/${this.appId}/endpoint/data/v1`;
    this.dataSource = env.MONGODB_DATASOURCE || 'Cluster0';
    this.database = env.MONGODB_DATABASE || 'harassment-platform';
  }

  async findOne(collection, filter) {
    return this._request('findOne', { collection, filter });
  }

  async find(collection, filter = {}, options = {}) {
    return this._request('find', { collection, filter, ...options });
  }

  async insertOne(collection, document) {
    return this._request('insertOne', { collection, document });
  }

  async updateOne(collection, filter, update) {
    return this._request('updateOne', { collection, filter, update });
  }

  async deleteOne(collection, filter) {
    return this._request('deleteOne', { collection, filter });
  }

  async aggregate(collection, pipeline) {
    return this._request('aggregate', { collection, pipeline });
  }

  async _request(action, data) {
    const response = await fetch(`${this.baseUrl}/action/${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': this.apiKey
      },
      body: JSON.stringify({
        dataSource: this.dataSource,
        database: this.database,
        ...data
      })
    });

    if (!response.ok) {
      throw new Error(`MongoDB API Error: ${response.status}`);
    }

    return response.json();
  }
}

export const getDB = (env) => new MongoDBAtlas(env);
