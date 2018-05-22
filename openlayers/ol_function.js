function flash(feature,number) {
	var start = new Date().getTime();
	var listenerKey;
	var duration = 10000;
	
	
	
	function animate(event) {
		var vectorContext = event.vectorContext;
		var frameState = event.frameState;
		var flashGeom = feature.getGeometry().clone();
		var elapsed = frameState.time - start;
		var elapsedRatio = elapsed / duration;
		// radius will be 5 at start and 30 at end.
		var radius = ol.easing.easeOut(elapsedRatio) * 10 + 5;
		var opacity = ol.easing.easeOut(1 - elapsedRatio);
		var style
		if(true){
			style = new ol.style.Style({
				image: new ol.style.Circle({
					radius: radius,
					snapToPixel: false,
					stroke: new ol.style.Stroke({
						color: 'rgba(255, 0, 0, ' + opacity + ')',
						width: 0.25 + opacity
					})
				})
			});
				  
		}else style = new ol.style.Style();
				
		style.setZIndex(100000);
		vectorContext.setStyle(style);
		vectorContext.drawGeometry(flashGeom);
		if (elapsed > duration) {
			ol.Observable.unByKey(listenerKey);
					
		}
		 // tell OpenLayers to continue postcompose animation
				  
		map.render();
				  
	}
	listenerKey = map.on('postcompose', animate);
	//broken_aniarr[number]=setTimeout(function(){flash(feature,number)},10000);
}


var createIcon = function(icon,scale, name, offx, offy) {
	var imageicon;
	var opacity;
	
	imageicon=icon;
	opacity=1;
	
	var obj = {
		image: new ol.style.Icon( ({
			scale: scale ? scale : 1,
			src: icon,
			rotation : 0,//rotation ? rotation * Math.PI / 180 : 0
			opacity : opacity
		}))
	};
	//레이블 폰트
	if(name){
		
		obj.text = new ol.style.Text({
				text: name,
				scale:1,
				offsetY: offy || 20,
				offsetX: offx || 0,
				stroke: new ol.style.Stroke({color: "#000", width:0.5}),
				fill: new ol.style.Fill({
				  color: '#000'
				})
			});
	};
	return new ol.style.Style(obj);
}



// overlay element 요소 생성
// name과 point는 필수요소 나머지는 선택
function makeLabel(obj){
	
	var options={
		name: obj.name, //표현할 텍스트
		point: obj.point, //overlay가 표시될 [경도,위도] 데이터
		class: (obj.class)? obj.class : "vessel_name_box", //해당 element에 부여될 class
		color: (obj.color)? obj.color : "#FFF", //문자 색상
		bgcolor: (obj.bgcolor)? obj.bgcolor : "#000", //배경색
		positioning: (obj.positioning)? obj.positioning : "center-left", //point 좌표에서 어느쪽으로 element를 생성할지 결정
		offset: (obj.offset)? obj.offset : [0,0] // [x,y]축 만큼 생성된 element를 이동 시킵니다.
	}
	
	var popupOpt = {};

	if(options.point){
		// 위경도 좌표를 데이터에 맞게 변환
		options.point=ol.proj.fromLonLat(options.point);
		
		//web element 정의
		var el = document.createElement("div");
		el.className = options.class; 
		el.style.color = options.color;
		el.style.backgroundColor  = options.bgcolor;
		el.innerHTML = options.name;
		
		//overlay option
		popupOpt = {
			element: el,
			offset: options.offset, // 배치좌표에서 x축 y축으로 얼마나 이동시킬지 세부조정
			position: options.point, //배치 좌표
			positioning : options.positioning, // 배치좌표에서 element 생성 시작점
			autoPan: false
		}
	}
	var overlay= new ol.Overlay(popupOpt) //오버레이 생성
	
	//LabelOverlay.push(overlay); //오버레이는 일괄적인 삭제가 불가능하고 하나하나 지정해서 지워야 하기떼믄에 전역배열변수에 추가.
	return overlay;
}


function getroutepathCoord(datarow){
	var route_arr=[];
	var data =JSON.parse(datarow);
	for(var i=0;i<data.length;i++){
		route_arr.push(data[i]);
								
	}
	return route_arr;
}

//route 경로를 그리는 함수.
function routeDraw(obj){
	var options={
		data:obj.data,
		dataType:(obj.dataType)? obj.dataType:"json",
		icon:(obj.icon)? obj.icon:false,
		iconImage:(obj.iconImage)? obj.iconImage:false
	}
	
	var routeLayer;
	var routeFea= [];
	var portFea=[];
	var data;
	if(options.dataType=="json"){
		data=getroutepathCoord(options.data);
	}else{
		data=options.data;
	}
	
	
	//Feature 별 스타일 만들기, 함수로 만들어서 이름에 따라 아이콘 변경하기
	var styles = {
		'route_end': new ol.style.Style({
			stroke: new ol.style.Stroke({
				color: '#b1e545',
				width: 5
				
			}),
			zIndex : 9100
		}),
		'icon': new ol.style.Style({
			image: new ol.style.Circle({
				radius: 10,
				stroke: new ol.style.Stroke({
				  color: '#fff'
				}),
				fill: new ol.style.Fill({
				  color: '#3399CC'
				})
			}),
			zIndex : 9999
		}),
		'sel_icon': new ol.style.Style({
			image: new ol.style.Circle({
				radius: 10,
				stroke: new ol.style.Stroke({
				  color: '#fff'
				}),
				fill: new ol.style.Fill({
				  color: '#CC9933'
				})
			}),
			zIndex : 9999
		}),
		'marker' : function(feature){
			var iconImage = feature.get("iconImage");
			//var name = feature.get("name");
			
			var style = new ol.style.Style({
				image: new ol.style.Icon({
					opacity:1,
					anchor: [0.5, 1],
					scale:0.8,
					src:iconImage
					
				}),
				/*text : new ol.style.Text({
					text: name,
					scale:1,
					offsetY: 10,
					offsetX: 0,
					stroke: new ol.style.Stroke({color: "#333", width:0.5}),
					fill: new ol.style.Fill({
					  color: '#eee'
					})
				})*/
			});
			return style;
		}
		
	};
		
	var arcCoordLength;
	if(data.length > 1){
		//경로의 각 꼭지점에 아이콘 생성
		if(options.icon){
			for(k = 0; k<data.length; k++){
				if(!options.iconImage){
					
					portFea.push(
							new ol.Feature({
								type: 'icon',
								geometry: new ol.geom.Point(ol.proj.fromLonLat(data[k])),
								sel_style:styles['sel_icon']
							})
					)
				}else{
					portFea.push(
						new ol.Feature({
							type: 'marker',
							iconImage : options.iconImage,
							geometry:  new ol.geom.Point(ol.proj.fromLonLat(data[k]))
						})
					);
				
				}
			}
		}
		arcCoordLength = data.length-1;
		//멀티라인 좌표로 만들기
		for(j = 0; j<arcCoordLength; j++){
			var lineCoord = [];
			lineCoord.push(data[j], data[j+1]);
			
			if(Math.abs(lineCoord[0][0] - lineCoord[1][0]) > 200){
				if(lineCoord[0][0] > 0 && lineCoord[1][0] < 0){
						lineCoord[1][0]=lineCoord[1][0]+360;
					}else if(lineCoord[0][0]< 0 && lineCoord[1][0] > 0){
					lineCoord[0][0]=lineCoord[0][0]+360;
				}		
			}
			
			routeFea.push(
				new ol.Feature({
					type: 'route_end',
					geometry: new ol.geom.MultiLineString([[ol.proj.fromLonLat(lineCoord[0]),ol.proj.fromLonLat(lineCoord[1])]])
				})
			);
		}
	}
	
	var allFeatures = routeFea.concat(portFea);
				
	
	routeLayer = new ol.layer.Vector({
		source: new ol.source.Vector({
			features: allFeatures
		}),
		style: function(feature) {
			
			var type = feature.get('type');
			
			
			if(type === 'marker'){
				return styles[type](feature);
			}
			
			return styles[type];
		}
	});
	//routeLayer.setZIndex(1201);
	
	return routeLayer;
	
	
}  



function DDolrouteDraw(obj){
	var options={
		data:obj.data,
		
		dataType:(obj.dataType)? obj.dataType:"json",
		icon:(obj.icon)? obj.icon:false,
		iconImage:(obj.iconImage)? obj.iconImage:false
	}
	var popupdata =obj.popupdata
	var namedata =obj.namedata
	var routeLayer;
	var routeFea= [];
	var portFea=[];
	var data;
	if(options.dataType=="json"){
		data=getroutepathCoord(options.data);
	}else{
		data=options.data;
	}
		
	
	//Feature 별 스타일 만들기, 함수로 만들어서 이름에 따라 아이콘 변경하기
	var styles = {
		'route_end': new ol.style.Style({
			stroke: new ol.style.Stroke({
				color: '#b1e545',
				width: 5
				
			}),
			zIndex : 9100
		}),
		'icon': new ol.style.Style({
			image: new ol.style.Circle({
				radius: 10,
				stroke: new ol.style.Stroke({
				  color: '#fff'
				}),
				fill: new ol.style.Fill({
				  color: '#3399CC'
				})
			}),
			zIndex : 9999
		}),
		'DDolicon':function(feature){
			var name=feature.get("name");
			var style =new ol.style.Style({
				image: new ol.style.Icon({
						opacity:1,
						anchor: [0.5, 1],
						scale:0.05,
						src:"./img/Sports_Mountain_Biking_icon.png"
						
				}),
				text : new ol.style.Text({
					text: name,
					scale:1.4,
					offsetY: -35,
					offsetX: -3,
					stroke: new ol.style.Stroke({color: "#000000", width:0.5}),
					fill: new ol.style.Fill({
					  color: '#000000'
					})
				}),
				zIndex : 9999
			
			})
			return style;
		},
		'sel_icon': new ol.style.Style({
			image: new ol.style.Circle({
				radius: 5,
				stroke: new ol.style.Stroke({
				  color: '#fff'
				}),
				fill: new ol.style.Fill({
				  color: '#CC9933'
				})
			}),
			zIndex : 9999
		}),
		'marker' : function(feature){
			var iconImage = feature.get("iconImage");
			var name = feature.get("name");
			
			var style = new ol.style.Style({
				image: new ol.style.Icon({
					opacity:1,
					anchor: [0.55,0.55],
					scale:1,
					src:iconImage
					
				}),
				text : new ol.style.Text({
					text: name,
					scale:1.5,
					offsetY: 18,
					offsetX: 0,
					stroke: new ol.style.Stroke({color: "#3333ff", width:0.5}),
					fill: new ol.style.Fill({
					  color: '#3333ff'
					})
				}),
				zIndex : 9999
			});
			return style;
		}
		
	};
		
	var arcCoordLength;
	if(data.length > 1){
		//경로의 각 꼭지점에 아이콘 생성
		if(options.icon){
			for(k = 0; k<data.length; k++){
				if(!options.iconImage){
					
					portFea.push(
							new ol.Feature({
								type: 'icon',
								geometry: new ol.geom.Point(ol.proj.fromLonLat(data[k])),
								sel_style:styles['sel_icon']
							})
					)
				}else{
					
					portFea.push(
						new ol.Feature({
							type: 'marker',
							iconImage : options.iconImage,
							geometry:  new ol.geom.Point(ol.proj.fromLonLat(data[k])),
							name: namedata[k]
						})
					);
					if(k!=data.length-1){
						
						portFea.push(
							new ol.Feature({
								type: 'DDolicon',
								geometry: new ol.geom.Point(ol.proj.fromLonLat([(data[k][0]+data[k+1][0])/2,(data[k][1]+data[k+1][1])/2])),
								sel_style:"DDolicon",
								popup:popupdata[k],
								name: (k+1)+"부"
							})
						)
				    }
				
				}
			}
		}
		arcCoordLength = data.length-1;
		//멀티라인 좌표로 만들기
		for(j = 0; j<arcCoordLength; j++){
			var lineCoord = [];
			lineCoord.push(data[j], data[j+1]);
			
			if(Math.abs(lineCoord[0][0] - lineCoord[1][0]) > 200){
				if(lineCoord[0][0] > 0 && lineCoord[1][0] < 0){
						lineCoord[1][0]=lineCoord[1][0]+360;
					}else if(lineCoord[0][0]< 0 && lineCoord[1][0] > 0){
					lineCoord[0][0]=lineCoord[0][0]+360;
				}		
			}
			
			routeFea.push(
				new ol.Feature({
					type: 'route_end',
					geometry: new ol.geom.MultiLineString([[ol.proj.fromLonLat(lineCoord[0]),ol.proj.fromLonLat(lineCoord[1])]])
				})
			);
		}
	}
	
	var allFeatures = routeFea.concat(portFea);
				
	
	routeLayer = new ol.layer.Vector({
		source: new ol.source.Vector({
			features: allFeatures
		}),
		style: function(feature) {
			
			var type = feature.get('type');
			
			
			if(type === 'marker'||type === 'DDolicon'){
				return styles[type](feature);
			}
			
			return styles[type];
		}
	});
	//routeLayer.setZIndex(1201);
	
	return routeLayer;
	
	
}  


function iconDraw(option){
	var options={
		data: option.data,
		type: (option.type)? option.type:"normal"
	}
			
	var IconFeas = [];
	var data = options.data;			
					
	var i = 0, Length = data.length;
	
	for(;i < Length; i++){
		
		var point = ol.proj.fromLonLat(data[i].point);

		var IconFea = new ol.Feature(new ol.geom.Point(point));
		IconFea.set('IconKey', data[i].key);
		IconFea.set('popup', data[i].popup);
		IconFea.set('type',options.type);
				
		//icon, rotation, scale, name, offx, offy
		IconFea.set('style', createIcon(data[i].icon, 1));
		IconFea.set('sel_style', createIcon(data[i].icon,1)); //선택 인터렉션이 들어올때의 아이콘
		IconFea.set('namestyle', createIcon(data[i].icon, 1, data[i].name)); //아이콘 하단에 텍스트 추가.
		IconFeas.push(IconFea);
	}
	
	var IconVector = new ol.source.Vector({
		features: IconFeas
	});
	
	//iconLayer = QvOSM_PVM_CUSTOM_MAP.removeLayer(iconLayer);
	
	iconLayer = new ol.layer.Vector({
		style : function(feature) {
			return (LabelC)? feature.get('namestyle'):feature.get('style');
				
		},
		source:IconVector
	});	
	iconLayer.setZIndex(9999);
	
	return iconLayer;
	
}

//bubble 그리는 함수
var bubbleDraw = function(option){
	
	var bubblesource_p = new ol.source.Vector();
	var bubbles_p;
	var bubbleData=option;
	
	for(var bk in bubbleData){
		var bRow = bubbleData[bk];
		var type = bRow["t"];
		var lonLat = bRow["point"];
		var point = new ol.geom.Point(lonLat);
		var rate = bRow["rate"];;
		point.transform(ol.proj.get('EPSG:4326'), ol.proj.get('EPSG:3857'));
		
		var radius = 100*rate;
		if(radius < 10)radius = 10;
		if(rate == 1)radius = 10;
		if(rate == 0)radius = 1;
		var feature = new ol.Feature(point);
		feature.set("i",{"t":type,"cd":bRow["key"],"nm":bRow["kname"],"r":radius*2});
		bubblesource_p.addFeature(feature);									
	}
	
	
	bubbles_p = new ol.layer.Vector({
		source: bubblesource_p,
		opacity:0.5,
		
		style:function(feature){
		  var info = feature.get("i");
		  var nm = info["nm"];
		  var scale = info["r"];

		  var b = {};
		  b.image =new ol.style.Circle({
			radius: scale,
			fill: new ol.style.Fill({
			  color:'#63b34b'
			})
		  });
		 
		  var style = new ol.style.Style(b);
		  return style;
		},
		zIndex:1000
	});
  
	return bubbles_p
}
