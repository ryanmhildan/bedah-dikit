import {Composition} from 'remotion';
import episode from '../data/ump-2026.json';
import {DataShort, TOTAL_FRAMES, type Episode} from './DataShort';
import {CONTOH_FRAMES, Contoh3D} from './Scene3D';
import {ILUSTRASI_FRAMES, Ilustrasi} from './Illustrated';
import {SINEMATIK_FRAMES, Sinematik} from './Sinematik';
import {AMAN, BANNER_H, BANNER_W, Banner, BannerAman} from './Banner';
import {Episode as VideoEpisode, type EpisodeProps} from './Episode';
import {Karakter} from './Tokoh';
import {UJI_GERAK_FRAMES, UjiGerak} from './pustaka/uji-gerak';
import {KATALOG_FRAMES, KatalogSet, UJI_SET_FRAMES, UjiSet} from './pustaka/uji-set';
import {LogoAvatar, LogoAvatarKecil, LogoB, LogoTeks, LogoTeksKecil, LogoTes, Logob} from './Logo';

export const RemotionRoot = () => (
  <>
    <Composition
      id="DataShort"
      component={DataShort}
      durationInFrames={TOTAL_FRAMES}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={episode as Episode}
    />
    <Composition
      id="Contoh3D"
      component={Contoh3D}
      durationInFrames={CONTOH_FRAMES}
      fps={30}
      width={1080}
      height={1920}
    />
    <Composition id="Ilustrasi" component={Ilustrasi} durationInFrames={ILUSTRASI_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="Sinematik" component={Sinematik} durationInFrames={SINEMATIK_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="UjiGerak" component={UjiGerak} durationInFrames={UJI_GERAK_FRAMES} fps={30} width={1080} height={1920} />
    {/* Sementara: klip uji tahap 1 set dan properti. */}
    <Composition id="UjiSet" component={UjiSet} durationInFrames={UJI_SET_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="KatalogSet" component={KatalogSet} durationInFrames={KATALOG_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="Karakter" component={Karakter} durationInFrames={60} fps={30} width={1620} height={880} />
    <Composition id="LogoAvatar" component={LogoAvatar} durationInFrames={1} fps={30} width={1024} height={1024} />
    <Composition id="LogoTeks" component={LogoTeks} durationInFrames={1} fps={30} width={1600} height={480} />
    <Composition id="LogoAvatarKecil" component={LogoAvatarKecil} durationInFrames={1} fps={30} width={1024} height={1024} />
    <Composition id="LogoTeksKecil" component={LogoTeksKecil} durationInFrames={1} fps={30} width={1600} height={480} />
    <Composition id="LogoB" component={LogoB} durationInFrames={1} fps={30} width={1024} height={1024} />
    <Composition id="Logob" component={Logob} durationInFrames={1} fps={30} width={1024} height={1024} />
    <Composition id="LogoTes" component={LogoTes} durationInFrames={1} fps={30} width={800} height={860} />
    <Composition id="Banner" component={Banner} durationInFrames={60} fps={30} width={BANNER_W} height={BANNER_H} />
    <Composition id="BannerAman" component={BannerAman} durationInFrames={60} fps={30} width={AMAN.w} height={AMAN.h} />
    <Composition
      id="Episode"
      component={VideoEpisode}
      durationInFrames={30}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{tokoh: 'raka', sumber: '', total: 30, adegan: []} as EpisodeProps}
      calculateMetadata={({props}) => ({durationInFrames: props.total})}
    />
  </>
);
