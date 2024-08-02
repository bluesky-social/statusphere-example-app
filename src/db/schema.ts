export type DatabaseSchema = {
  post: Post
}

export type Post = {
  uri: string
  text: string
  indexedAt: string
}
