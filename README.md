# Rich Table Editor Plugin

This is an expansion of the Dato plugin Table Editor to allow rich text editing, images and buttons inside a cell in a table. It is a custom made private plugin.

## How to dev

Run the app with `yarn dev`. Go to Dato project, click the `Configuration` tab then select `Plugins` and find `Rich Table Plugin` in the list of plugins. Click the 3 dots next to the plugin title and select `Edit private plugin` to access the configuration settings. In the field `Entry point url` replace the existing URL with the local address where the app is running (e.g. ` http://localhost:5173/` ). Please note: this temporarily disables the plugin for everyone else, to run exclusively in your local environment. Therefore make sure you don't do this in production and don't forget to put back the old URL in the same field when you're done hacking.

## How to deploy

The entrypoint URL for the plugin is: https://dato-rich-table-editor.vercel.app/ . Currently the only person able to deploy this plugin is @mivd7. It is currently hosted on his personal vercel account. Moving this to a shared host where everyone can build and deploy the app should be implemented soon.
