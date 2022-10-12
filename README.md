<p>
  <img alt="Version" src="https://api.gouv.fr/images/api-logo/logo-cnous.png" align="right"/>
  <h1 align="left">Crous Api</h1>
</p>
<p>
  <img alt="Version" src="https://img.shields.io/badge/version-1.0-blue.svg?cacheSeconds=2592000" />
  <a href="https://le-roux-nard.github.io/crous-api/" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a>
  <a href="#" target="_blank">
    <img alt="License: ISC" src="https://img.shields.io/badge/License-ISC-yellow.svg" />
  </a>
  <br/>
  <br/>
</p>

> Cette API a été conçue lors d'un semestre d'études au CEGEP de Matane suite à un échange avec l'IUT de Laval, France.
> <br/>
> Elle permet la récupération de toutes les données fournies par l'État français et liées aux CROUS.
> <br/>
> Les données suivantes sont ainsi accessibles :
> <br/>

-   Les Restaurants et leurs menus (si communiqué)
-   Les Résidences
-   Les Actualités

Les structures de données sont disponibles dans la documention fournie, soit [via l'url suivante](https://le-roux-nard.github.io/crous-api/), soit via l'endpoint `/docs` une fois l'API fonctionnelle

⚠ _Les données de base étant stockées dans un fichier XML et contenant des balises HTML, certains type de données ne sont pas entièrement exploitables (Résidences et Actualités)_

## Installation

```sh
npm install
```

## Utilisation

#### En tant que serveur web

```sh
npm run start
```

#### En tant que module

```ts
import express from "express";
import setupRouter from "./router";

const app = express();
const crousRouter = setupRouter(socketIoNamespace);
app.use("myPath", crousRouter);
app.listen(process.env.PORT ?? 8080);
```

<br/>

L'API prenant quelques secondes à s'initialiser, toute requête réalisée avant la fin de ce processus amènera la réponse suivante
<br/>
~~`425 - Api Starting, please wait...`~~
<br/>

## Auteur

👤 **Le_Roux-Nard**

<!-- -   Website: ... -->

-   Github: [@le-roux-nard](https://github.com/le-roux-nard)

---

_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_
