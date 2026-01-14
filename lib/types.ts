export interface Rating {
  aggregateRating: number
  voteCount: number
}

export interface ImageData {
  url: string
  width: number
  height: number
}

export interface VideoSources {
  autoembed_url?: string
  gomo_url?: string
  moviesapi_url?: string
  vidlink_pro_url?: string
  vidsrc_url?: string
}

export interface Person {
  id: string
  displayName: string
  primaryImage?: ImageData
}

export interface Episode {
  id: string
  episodeNumber: number
  title: string
  plot?: string
  runtimeSeconds?: number
  rating?: Rating
  primaryImage?: ImageData
}

export interface Season {
  seasonNumber: number
  episodes: Episode[]
}

export interface Content {
  imdb_id: string
  tmdb_id?: string
  title: string
  type: "movie" | "tv"
  quality?: string
  startYear?: number
  runtimeSeconds?: number
  genres: string[]
  rating?: Rating
  plot?: string
  primaryImage?: ImageData
  backdropImage?: ImageData
  primaryVideo?: VideoSources
  directors?: Person[]
  writers?: Person[]
  stars?: Person[]
  originCountries?: string[]
  spokenLanguages?: string[]
  interests?: string[]
  seasons?: Season[]
}

export interface Channel {
  id: string
  name: string
  logo?: string
  quality?: string
  url: string
  category?: string
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  avatar?: string
  watchlist: string[]
  watchHistory: string[]
}
