define(["itemShortcuts","connectionManager","playbackManager","imageLoader","layoutManager","browser","dom","loading","focusManager","serverNotifications","events","registerElement"],function(itemShortcuts,connectionManager,playbackManager,imageLoader,layoutManager,browser,dom,loading,focusManager,serverNotifications,events){"use strict";function onClick(e){var itemsContainer=this,multiSelect=(e.target,itemsContainer.multiSelect);multiSelect&&multiSelect.onContainerClick.call(itemsContainer,e)===!1||itemShortcuts.onClick.call(itemsContainer,e)}function disableEvent(e){return e.preventDefault(),e.stopPropagation(),!1}function onContextMenu(e){var itemsContainer=this,target=e.target,card=dom.parentWithAttribute(target,"data-id");if(card&&card.getAttribute("data-serverid"))return itemShortcuts.showContextMenu(card,{positionTo:target,itemsContainer:itemsContainer}),e.preventDefault(),e.stopPropagation(),!1}function getShortcutOptions(){return{click:!1}}function onDrop(evt,itemsContainer){var el=evt.item,newIndex=evt.newIndex,itemId=el.getAttribute("data-playlistitemid"),playlistId=el.getAttribute("data-playlistid");if(!playlistId){var oldIndex=evt.oldIndex;return void el.dispatchEvent(new CustomEvent("itemdrop",{detail:{oldIndex:oldIndex,newIndex:newIndex,playlistItemId:itemId},bubbles:!0,cancelable:!1}))}var serverId=el.getAttribute("data-serverid"),apiClient=connectionManager.getApiClient(serverId);newIndex=Math.max(0,newIndex-1),loading.show(),apiClient.ajax({url:apiClient.getUrl("Playlists/"+playlistId+"/Items/"+itemId+"/Move/"+newIndex),type:"POST"}).then(function(){loading.hide()},function(){loading.hide(),itemsContainer.refreshItems()})}function onUserDataChanged(e,apiClient,userData){var itemsContainer=this;require(["cardBuilder"],function(cardBuilder){cardBuilder.onUserDataChanged(userData,itemsContainer)});var eventsToMonitor=getEventsToMonitor(itemsContainer);eventsToMonitor.indexOf("markfavorite")!==-1?itemsContainer.notifyRefreshNeeded():eventsToMonitor.indexOf("markplayed")!==-1&&itemsContainer.notifyRefreshNeeded()}function getEventsToMonitor(itemsContainer){var monitor=itemsContainer.getAttribute("data-monitor");return monitor?monitor.split(","):[]}function onTimerCreated(e,apiClient,data){var itemsContainer=this;if(getEventsToMonitor(itemsContainer).indexOf("timers")!==-1)return void itemsContainer.notifyRefreshNeeded();var programId=data.ProgramId,newTimerId=data.Id;require(["cardBuilder"],function(cardBuilder){cardBuilder.onTimerCreated(programId,newTimerId,itemsContainer)})}function onSeriesTimerCreated(e,apiClient,data){var itemsContainer=this;if(getEventsToMonitor(itemsContainer).indexOf("seriestimers")!==-1)return void itemsContainer.notifyRefreshNeeded()}function onTimerCancelled(e,apiClient,data){var itemsContainer=this;if(getEventsToMonitor(itemsContainer).indexOf("timers")!==-1)return void itemsContainer.notifyRefreshNeeded();var id=data.Id;require(["cardBuilder"],function(cardBuilder){cardBuilder.onTimerCancelled(id,itemsContainer)})}function onSeriesTimerCancelled(e,apiClient,data){var itemsContainer=this;if(getEventsToMonitor(itemsContainer).indexOf("seriestimers")!==-1)return void itemsContainer.notifyRefreshNeeded();var id=data.Id;require(["cardBuilder"],function(cardBuilder){cardBuilder.onSeriesTimerCancelled(id,itemsContainer)})}function onLibraryChanged(e,apiClient,data){var itemsContainer=this,eventsToMonitor=getEventsToMonitor(itemsContainer);if(eventsToMonitor.indexOf("seriestimers")===-1&&eventsToMonitor.indexOf("timers")===-1){var itemsAdded=data.ItemsAdded||[],itemsRemoved=data.ItemsRemoved||[];if(itemsAdded.length||itemsRemoved.length){var parentId=itemsContainer.getAttribute("data-parentid");if(parentId){var foldersAddedTo=data.FoldersAddedTo||[],foldersRemovedFrom=data.FoldersRemovedFrom||[],collectionFolders=data.CollectionFolders||[];if(foldersAddedTo.indexOf(parentId)===-1&&foldersRemovedFrom.indexOf(parentId)===-1&&collectionFolders.indexOf(parentId)===-1)return}itemsContainer.notifyRefreshNeeded()}}}function onPlaybackStopped(e,stopInfo){var itemsContainer=this,state=stopInfo.state,eventsToMonitor=getEventsToMonitor(itemsContainer);if(state.NowPlayingItem&&"Video"===state.NowPlayingItem.MediaType){if(eventsToMonitor.indexOf("videoplayback")!==-1)return void itemsContainer.notifyRefreshNeeded(!0)}else if(state.NowPlayingItem&&"Audio"===state.NowPlayingItem.MediaType&&eventsToMonitor.indexOf("audioplayback")!==-1)return void itemsContainer.notifyRefreshNeeded(!0)}function addNotificationEvent(instance,name,handler,owner){var localHandler=handler.bind(instance);owner=owner||serverNotifications,events.on(owner,name,localHandler),instance["event_"+name]=localHandler}function removeNotificationEvent(instance,name,owner){var handler=instance["event_"+name];handler&&(owner=owner||serverNotifications,events.off(owner,name,handler),instance["event_"+name]=null)}function clearRefreshInterval(itemsContainer,isPausing){itemsContainer.refreshInterval&&(clearInterval(itemsContainer.refreshInterval),itemsContainer.refreshInterval=null,isPausing||(itemsContainer.refreshIntervalEndTime=null))}function resetRefreshInterval(itemsContainer,intervalMs){clearRefreshInterval(itemsContainer),intervalMs||(intervalMs=parseInt(itemsContainer.getAttribute("data-refreshinterval")||"0")),intervalMs&&(itemsContainer.refreshInterval=setInterval(itemsContainer.notifyRefreshNeeded.bind(itemsContainer),intervalMs),itemsContainer.refreshIntervalEndTime=(new Date).getTime()+intervalMs)}function onDataFetched(result){var items=result.Items||result,parentContainer=this.parentContainer;parentContainer&&(items.length?parentContainer.classList.remove("hide"):parentContainer.classList.add("hide"));var focusId,hasActiveElement,activeElement=document.activeElement;this.contains(activeElement)&&(hasActiveElement=!0,focusId=activeElement.getAttribute("data-id")),this.innerHTML=this.getItemsHtml(items),imageLoader.lazyChildren(this),hasActiveElement&&setFocus(this,focusId),resetRefreshInterval(this),this.afterRefresh&&this.afterRefresh(result)}function setFocus(itemsContainer,focusId){if(focusId){var newElement=itemsContainer.querySelector('[data-id="'+focusId+'"]');if(newElement)try{return void focusManager.focus(newElement)}catch(err){}}focusManager.autoFocus(itemsContainer)}var ItemsContainerProtoType=Object.create(HTMLDivElement.prototype);ItemsContainerProtoType.enableHoverMenu=function(enabled){var current=this.hoverMenu;if(!enabled)return void(current&&(current.destroy(),this.hoverMenu=null));if(!current){var self=this;require(["itemHoverMenu"],function(ItemHoverMenu){self.hoverMenu=new ItemHoverMenu(self)})}},ItemsContainerProtoType.enableMultiSelect=function(enabled){var current=this.multiSelect;if(!enabled)return void(current&&(current.destroy(),this.multiSelect=null));if(!current){var self=this;require(["multiSelect"],function(MultiSelect){self.multiSelect=new MultiSelect({container:self,bindOnClick:!1})})}},ItemsContainerProtoType.enableDragReordering=function(enabled){var current=this.sortable;if(!enabled)return void(current&&(current.destroy(),this.sortable=null));if(!current){var self=this;require(["sortable"],function(Sortable){self.sortable=new Sortable(self,{draggable:".listItem",handle:".listViewDragHandle",onEnd:function(evt){return onDrop(evt,self)}})})}},ItemsContainerProtoType.createdCallback=function(){this.classList.add("itemsContainer")},ItemsContainerProtoType.attachedCallback=function(){this.addEventListener("click",onClick),browser.touch?this.addEventListener("contextmenu",disableEvent):"false"!==this.getAttribute("data-contextmenu")&&this.addEventListener("contextmenu",onContextMenu),layoutManager.desktop&&"false"!==this.getAttribute("data-hovermenu")&&this.enableHoverMenu(!0),(layoutManager.desktop||layoutManager.mobile)&&"false"!==this.getAttribute("data-multiselect")&&this.enableMultiSelect(!0),layoutManager.tv&&this.classList.add("itemsContainer-tv"),itemShortcuts.on(this,getShortcutOptions()),addNotificationEvent(this,"UserDataChanged",onUserDataChanged),addNotificationEvent(this,"TimerCreated",onTimerCreated),addNotificationEvent(this,"SeriesTimerCreated",onSeriesTimerCreated),addNotificationEvent(this,"TimerCancelled",onTimerCancelled),addNotificationEvent(this,"SeriesTimerCancelled",onSeriesTimerCancelled),addNotificationEvent(this,"LibraryChanged",onLibraryChanged),addNotificationEvent(this,"playbackstop",onPlaybackStopped,playbackManager),"true"===this.getAttribute("data-dragreorder")&&this.enableDragReordering(!0)},ItemsContainerProtoType.detachedCallback=function(){clearRefreshInterval(this),this.enableHoverMenu(!1),this.enableMultiSelect(!1),this.enableDragReordering(!1),this.removeEventListener("click",onClick),this.removeEventListener("contextmenu",onContextMenu),this.removeEventListener("contextmenu",disableEvent),itemShortcuts.off(this,getShortcutOptions()),removeNotificationEvent(this,"UserDataChanged"),removeNotificationEvent(this,"TimerCreated"),removeNotificationEvent(this,"SeriesTimerCreated"),removeNotificationEvent(this,"TimerCancelled"),removeNotificationEvent(this,"SeriesTimerCancelled"),removeNotificationEvent(this,"LibraryChanged"),removeNotificationEvent(this,"playbackstop",playbackManager),this.fetchData=null,this.getItemsHtml=null,this.parentContainer=null},ItemsContainerProtoType.pause=function(){clearRefreshInterval(this,!0),this.paused=!0},ItemsContainerProtoType.resume=function(options){this.paused=!1;var refreshIntervalEndTime=this.refreshIntervalEndTime;if(refreshIntervalEndTime){var remainingMs=refreshIntervalEndTime-(new Date).getTime();remainingMs>0&&!this.needsRefresh?resetRefreshInterval(this,remainingMs):(this.needsRefresh=!0,this.refreshIntervalEndTime=null)}return this.needsRefresh||options&&options.refresh?this.refreshItems():Promise.resolve()},ItemsContainerProtoType.refreshItems=function(){return this.fetchData?this.paused?(this.needsRefresh=!0,Promise.resolve()):(this.needsRefresh=!1,this.fetchData().then(onDataFetched.bind(this))):Promise.resolve()},ItemsContainerProtoType.notifyRefreshNeeded=function(isInForeground){if(this.paused)return void(this.needsRefresh=!0);var timeout=this.refreshTimeout;timeout&&clearTimeout(timeout),isInForeground===!0?this.refreshItems():this.refreshTimeout=setTimeout(this.refreshItems.bind(this),1e4)},document.registerElement("emby-itemscontainer",{prototype:ItemsContainerProtoType,extends:"div"})});