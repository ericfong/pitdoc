package com.pithway.doc_dev;

import com.pithway.doc.PithwayAppActivity;

public class PithwayAppActivity_Dev extends PithwayAppActivity {

	@Override
	public void afterCreate() {
		super.loadUrl("http://1.1.1.10:2222/gen.cordova.html");
	}
	
}
