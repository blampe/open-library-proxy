import { MeiliSearch } from 'meilisearch'
import type { MeiliWork } from './types'

console.log('Connecting to MeiliSearch...')
const client = new MeiliSearch({ host: 'localhost:7700' })
while (!(await client.isHealthy())) {
  await new Promise((resolve) => setTimeout(resolve, 1000))
}
console.log('Connected to MeiliSearch')

const works = client.index<MeiliWork>('works')

// Set order in which attributes are preferred during search. Do this first so
// we don't bother indexing unsearchable fields during ingestion.
await works.updateSearchableAttributes(['id', 'title', 'authors', 'series', 'subtitle'])
await works.updateSortableAttributes(['reviewCount', 'authorRatingCount'])
await works.updateRankingRules([
  'words',
  'typo',
  'proximity',
  'attribute',
  'sort',
  'ratingCount:desc',
  'authorRatingCount:desc',
])

export { client, works }
