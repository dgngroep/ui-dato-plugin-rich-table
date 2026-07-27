# Rich Table Editor Plugin

This is an expansion of the Dato plugin Table Editor to allow rich text editing, images and buttons inside a cell in a table. It is a custom made private plugin.

## Stored value

The plugin stores its value as JSON in the field:

```jsonc
{
  "columns": ["Product", "Price"], // column keys, in display order
  "columnLabels": { "Price": "Price (EUR)" }, // optional display names per column key
  "columnWidths": { "Price": 220 }, // optional widths per column key
  "data": [
    {
      "Product": {
        /* cell value */
      },
      "Price": {
        /* cell value */
      },
    },
  ],
}
```

## How to dev

Run the app with `yarn dev`. Go to Dato project, click the `Configuration` tab then select `Plugins` and find `Rich Table Plugin` in the list of plugins. Click the 3 dots next to the plugin title and select `Edit private plugin` to access the configuration settings. In the field `Entry point url` replace the existing URL with the local address where the app is running (e.g. ` http://localhost:5173/` ). You should now be able to see your changes to the plugin, when adding a rich content table to a page or as standalone structured component. Please note: this temporarily disables the plugin for everyone else, to run exclusively in your local environment. Therefore make sure you don't do this in production and don't forget to put back the old URL in the same field when you're done hacking.

## How to deploy

The plugin is automatically deployed to GitHub Pages on every push to `main`. The entrypoint URL is:

https://dgngroep.github.io/ui-dato-plugin-rich-table/

No manual deployment steps are needed.
