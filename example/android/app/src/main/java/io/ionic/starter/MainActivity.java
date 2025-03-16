package io.ionic.starter;

import android.os.Bundle;
import com.getcapacitor.Plugin;
import java.util.ArrayList;
import de.metaflash.plugins.galleryplus.GalleryPlusPlugin;
import com.getcapacitor.BridgeActivity;
import android.util.Log;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Log.i("Capacitor/Console", "onCreate");
        
        // Initialize the Bridge
        this.registerPlugins(new ArrayList<Class<? extends Plugin>>() {
            {
                // Add your custom plugins here
                Log.i("Capacitor/Console", "Init Bridge");
                add(GalleryPlusPlugin.class);
            }
        });
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        this.bridge.onDestroy();
    }
}
