/*
 * Copyright (C) 2012 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.eddyy.android;

import com.eddyy.android_httpd.Sync;
import com.pithway.doc.PithwayAppActivity;

import android.content.Context;
import android.net.nsd.NsdServiceInfo;
import android.net.nsd.NsdManager;
import android.util.Log;

public class NsdHelper {
    public static final String TAG = NsdHelper.class.getName();
    public static final String SERVICE_TYPE = "_http._tcp.";
    public static final String serviceNamePrefix = "Pithway";

    private NsdManager nsdManager;
    private NsdManager.RegistrationListener mRegistrationListener = null;
    private NsdManager.ResolveListener mResolveListener = null;
    private NsdManager.DiscoveryListener mDiscoveryListener = null;

    private String localServerName;

    public NsdHelper(PithwayAppActivity activity) {
        try {
            nsdManager = (NsdManager) activity.getSystemService(Context.NSD_SERVICE);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void registerService(int port) {
        NsdServiceInfo service = new NsdServiceInfo();
        service.setPort(port);
        service.setServiceType(SERVICE_TYPE);
        service.setServiceName(serviceNamePrefix);
        
        Log.d(TAG, "Reg: " + SERVICE_TYPE + " - " + port + " - " + serviceNamePrefix);
        unregisterService();
        mRegistrationListener = new NsdManager.RegistrationListener() {
            @Override
            public void onServiceRegistered(NsdServiceInfo service) {
                localServerName = service.getServiceName();
                //discoverServices();
                Log.d(TAG, "Registration Succeeded: " + localServerName);
            }

            @Override
            public void onRegistrationFailed(NsdServiceInfo arg0, int arg1) {
                Log.e(TAG, "Registration failed" + arg0 + " : " + arg1);
            }

            @Override
            public void onServiceUnregistered(NsdServiceInfo arg0) {
            }

            @Override
            public void onUnregistrationFailed(NsdServiceInfo service, int errorCode) {
            }
        };
        nsdManager.registerService(service, NsdManager.PROTOCOL_DNS_SD, mRegistrationListener);
    }

    private void unregisterService() {
    	if (mRegistrationListener != null) {
        	try {
        		nsdManager.unregisterService(mRegistrationListener);
        	} catch (IllegalArgumentException e) {
        	}
    	}
    }
    
    public void discoverServices() {
        if (mDiscoveryListener == null) {
            mResolveListener = new NsdManager.ResolveListener() {
                @Override
                public void onResolveFailed(NsdServiceInfo service, int errorCode) {
                    Log.e(TAG, "Resolve failed" + errorCode);
                }

                @Override
                public void onServiceResolved(NsdServiceInfo serverInfo) {
                    Log.d(TAG, "Resolve Succeeded: " + serverInfo);
                    String host = serverInfo.getHost().getHostAddress()+":"+serverInfo.getPort();
//                    fireEvent(false, host);
                    Sync.INSTANCE.addServerHost(host);
                }
            };
            
            mDiscoveryListener = new NsdManager.DiscoveryListener() {
                @Override
                public void onDiscoveryStarted(String regType) {
                    //Log.d(TAG, "Service discovery started");
                }

                @Override
                public void onDiscoveryStopped(String serviceType) {
                    //Log.i(TAG, "Discovery stopped: " + serviceType);
                }

                @Override
                public void onServiceFound(NsdServiceInfo server) {
                    Log.d(TAG, "Service discovery success" + server);
                    if (!server.getServiceType().equals(SERVICE_TYPE)) {
                        Log.d(TAG, "Unknown Service Type: " + server.getServiceType());
                        return;
                    }
                    if (localServerName != null) {
                        if (server.getServiceName().equals(localServerName)) {
                            //Log.d(TAG, "Same Registration: " + localServerName);
                        } else if (server.getServiceName().contains(serviceNamePrefix)){
                            nsdManager.resolveService(server, mResolveListener);
                        }
                    }
                }

                @Override
                public void onServiceLost(NsdServiceInfo serverInfo) {
                    Log.e(TAG, "service lost" + serverInfo);
                    String host = serverInfo.getHost().getHostAddress()+":"+serverInfo.getPort();
//                    fireEvent(false, host);
                    Sync.INSTANCE.removeServerHost(host);
                }

                @Override
                public void onStartDiscoveryFailed(String serviceType, int errorCode) {
                    Log.e(TAG, "Discovery failed: Error code:" + errorCode);
                    nsdManager.stopServiceDiscovery(this);
                }

                @Override
                public void onStopDiscoveryFailed(String serviceType, int errorCode) {
                    Log.e(TAG, "Discovery failed: Error code:" + errorCode);
                    nsdManager.stopServiceDiscovery(this);
                }
            };
            
        }
        nsdManager.discoverServices(SERVICE_TYPE, NsdManager.PROTOCOL_DNS_SD, mDiscoveryListener);
    }
    
    public void stopDiscovery() {
        if (mDiscoveryListener != null) {
        	try {
                nsdManager.stopServiceDiscovery(mDiscoveryListener);
        	} catch (IllegalArgumentException e) {
        	}
        }
    }

    public void tearDown() {
        this.stopDiscovery();
        this.unregisterService();
    }
}
