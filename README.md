# open-library-proxy

Serve a search API on top of the [OpenLibrary](https://openlibrary.org/developers/dumps) corpus.

Primarily for consumption by [Readarr](https://wiki.servarr.com/readarr).

## Development

This project uses [mise](http://mise.jdx.dev) to manage local tools.

Install `mise`:

```sh
curl https://mise.run | sh
```

Then install [hooks](https://mise.jdx.dev/getting-started.html#_2a-activate-mise) for your shell of choice.
For example:

```sh
echo 'eval "$(mise activate zsh)"' >> ~/.zshrc
```

Install dependencies:

```sh
mise install
```

Grab the OpenLibrary dump:

> [!WARNING]
> You need ~100GB of free disk space to download and decompress the corpus.
> This initial dump and ingest will take quite a while.

```sh
mise run openlibrary:*
```

This command will no-op if you already have the latest bulk export.

Start MongoDB, Meilisearch, and the app:

```sh
mise run serve:*
```
