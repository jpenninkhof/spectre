jQuery.sap.declare("com.james.spectre.search.util.Formatter");

com.james.spectre.search.util.Formatter = {
	
	supplier: function(key) {
		return sap.ui.component(
			sap.ui.core.Component.getOwnerIdFor(
				this.getView()
			))
			.getValue(
				parseInt(key),
				"/Suppliers",
				"Id",
				"Name"
			);
	},
	
	category: function(key) {
		return sap.ui.component(
			sap.ui.core.Component.getOwnerIdFor(
				this.getView()
			))
			.getValue(
				parseInt(key),
				"/Categories",
				"Id",
				"Name"
			);
	}

	
};