# Development Setup
This setup uses twig.js for templating. More info on twig.js templating can be found [here](https://github.com/twigjs/twig.js/wiki).
twig.js JSON data is stored in ``data.json``.

## Folder Structure
The ``src`` folder contains scss, js, and media files and they will compile to ``dist``.
The ``dist`` folder will contain compiled html, js and css.

## SCSS/JS
Webpack is used to compile JS and SCSS, html, images and twig.js templates. The configs are located in the root. If you edit the config, please ensure output remains in the same paths for the production deployment. Upon commit, the production task will be run and will compile the project to the ``dist`` folder.

## Media Files
Images and videos stored in the repository for the project must be placed in ``src/media/``.
On your local setup, they will show up using ``./media/FILENAME.EXT``. (please remember the ./)
On production, these images will be compressed and output to ``dist/media``.


## Inline SVGs
You can make an svg render inline in the template by using this markup when adding it. The class will be pass along to the svg and it will be minified.
```
[[svg::circle]]
```
This will render like so:
```
<svg class="svg-circle" viewBox="0 0 100 100">
	<circle cx="50" cy="50" r="40" fill="#ff0" stroke="green" stroke-width="4"></circle>
</svg>
```

## Local Server
You can use a local server to view changes in your project.  BrowserSync is set up to view pages on your local server without refreshing manually.
&NewLine;
```bash
npm run watch
```

## Versioning
The version number in package.json is incremented on the 3rd digit on every push. ex.(1.0.x)
The version number can be updated manually with the `npm run bump` command.


### Mobile Local Testing

For Local testing on a mobile device, get your local ip address and access port 3000
eg. http://192.168.1.12:3000
