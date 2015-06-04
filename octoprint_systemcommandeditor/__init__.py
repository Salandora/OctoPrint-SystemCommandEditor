# coding=utf-8
from __future__ import absolute_import

__author__ = "Marc Hannappel <salandora@gmail.com>"
__license__ = 'GNU Affero General Public License http://www.gnu.org/licenses/agpl.html'

import octoprint.plugin

class SystemCommandEditorPlugin(octoprint.plugin.SettingsPlugin,
								octoprint.plugin.TemplatePlugin,
								octoprint.plugin.BlueprintPlugin,
								octoprint.plugin.AssetPlugin):
	def get_settings_defaults(self):
		return dict(actions=[])

	def get_template_configs(self):
		if "editorcollection" in self._plugin_manager.enabled_plugins:
			return [
				dict(type="plugin_editorcollection_EditorCollection", template="systemcommandeditor_hookedsettings.jinja2", custom_bindings=True)
			]
		else:
			return [
				dict(type="settings", template="systemcommandeditor_hookedsettings.jinja2", custom_bindings=True)
			]

	def on_settings_save(self, data):
		pass

	def get_assets(self):
		return dict(
			js=["js/jquery.ui.sortable.js",
				"js/systemcommandeditor.js",
				"js/systemcommandeditorDialog.js"]
		)

# If you want your plugin to be registered within OctoPrint under a different name than what you defined in setup.py
# ("OctoPrint-PluginSkeleton"), you may define that here. Same goes for the other metadata derived from setup.py that
# can be overwritten via __plugin_xyz__ control properties. See the documentation for that.
__plugin_name__ = "System Command Editor"

def __plugin_load__():
	global __plugin_implementation__
	__plugin_implementation__ = SystemCommandEditorPlugin()

	global __plugin_license__
	__plugin_license__ = "AGPLv3"
