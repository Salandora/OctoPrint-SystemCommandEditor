# coding=utf-8
from __future__ import absolute_import

### (Don't forget to remove me)
# This is a basic skeleton for your plugin's __init__.py. You probably want to adjust the class name of your plugin
# as well as the plugin mixins it's subclassing from. This is really just a basic skeleton to get you started,
# defining your plugin as a template plugin.
#
# Take a look at the documentation on what other plugin mixins are available.

from flask import jsonify
from octoprint.settings import settings

import octoprint.plugin

class SystemCommandEditorPlugin(octoprint.plugin.SettingsPlugin,
								octoprint.plugin.TemplatePlugin,
								octoprint.plugin.BlueprintPlugin,
								octoprint.plugin.AssetPlugin):
	def get_settings_defaults(self):
		return dict(actions=[])

	def get_template_configs(self):
		return [dict(type="settings", custom_bindings=True)]

	def on_settings_save(self, data):
		pass

	def get_assets(self):
		return dict(
			js=["js/systemcommandeditor.js",
				"js/systemcommandeditorDialog.js"]
		)
	
	@octoprint.plugin.BlueprintPlugin.route("/systemCommands", methods=["GET"])
	def systemCommands(self):
		s = settings()
		return jsonify(actions=s.get(["system", "actions"]))
	

# If you want your plugin to be registered within OctoPrint under a different name than what you defined in setup.py
# ("OctoPrint-PluginSkeleton"), you may define that here. Same goes for the other metadata derived from setup.py that
# can be overwritten via __plugin_xyz__ control properties. See the documentation for that.
__plugin_name__ = "System Command Editor"

def __plugin_load__():
	global __plugin_implementation__
	__plugin_implementation__ = SystemCommandEditorPlugin()

	# global __plugin_hooks__
	# __plugin_hooks__ = {"some.octoprint.hook": __plugin_implementation__.some_hook_handler}
