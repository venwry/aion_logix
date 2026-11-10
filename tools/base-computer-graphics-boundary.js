// A slot is a host interface, not an installed display implementation.
export const unfittedGraphicsHosts={
 'device.base_computer.artemis':'device.artemis_video_card_16kb',
 'device.base_computer.artemis_pro':'device.artemis_video_card',
 'device.base_computer.athena':'device.artemis_video_card_64kb',
 'device.base_computer.athena_server':'device.artemis_video_card_64kb'
};
export function removeUnfittedLegacyGraphics(record){
 if(!unfittedGraphicsHosts[record.id])return record;
 for(const v of record.composition_history||[]){
  const t=v.technical_definition;if(!t)continue;
  if(t.technical_profile){delete t.technical_profile.video;if(t.technical_profile.memory)delete t.technical_profile.memory.video_ram_policy;if(t.technical_profile.software_compatibility)delete t.technical_profile.software_compatibility.native_40_column_mode;}
  if(t.integration_requirements){delete t.integration_requirements.video_ram_policy;if(!Object.keys(t.integration_requirements).length)delete t.integration_requirements;}
 }
 return record;
}
export function correctBaseComputerGraphics(record){
 if(!unfittedGraphicsHosts[record.id])return record;
 const graphicsChapters=new Set(['Display architecture','Display memory and sprites','Scanout pipeline','Memory arbitration and display qualification']);
 const spec=record.technical_specification;
 if(spec){
  spec.chapters=spec.chapters.filter(c=>!graphicsChapters.has(c.chapter_name));
  for(const [i,c] of spec.chapters.entries()){
   c.number=i+1;
   c.description=c.description.replace('They discover usable display dimensions and the native 40 × 25 / 80-column modes through capability queries.','Applications query the capabilities of the separately installed display hardware.');
   if(c.chapter_name==='System architecture'){
    c.description=c.description.replace('is a desktop/server chassis; mechanical design pending built around','uses a desktop/server chassis built around');
    c.description=c.description.replace('A replaceable, non-hot-swappable video card uses a dedicated keyed connector','The host provides a dedicated keyed connector for a separately installed, non-hot-swappable video card');
    if(!c.description.includes('The base computer is supplied without a graphics card.'))c.description+='\n\nThe base computer is supplied without a graphics card. Display capabilities are defined by the card and monitor selected for the complete system.';
   }
  }
  const used=new Set(spec.chapters.flatMap(c=>[...c.description.matchAll(/\{([^{}]+)\}/g)].map(m=>m[1])));
  spec.parameters=spec.parameters.filter(p=>used.has(p.key));
 }
 delete record.graphic_modes_specification;
 return removeUnfittedLegacyGraphics(record);
}
