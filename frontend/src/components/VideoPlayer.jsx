function toEmbed(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace("www.", "");

    // YouTube
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = u.searchParams.get("v");
      if (id) return { type: "iframe", src: `https://www.youtube.com/embed/${id}` };
      if (u.pathname.startsWith("/embed/")) return { type: "iframe", src: url };
    }
    if (host === "youtu.be") {
      return { type: "iframe", src: `https://www.youtube.com/embed/${u.pathname.slice(1)}` };
    }

    // Vimeo
    if (host === "vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id) return { type: "iframe", src: `https://player.vimeo.com/video/${id}` };
    }

    // Fichier vidéo direct
    if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(u.pathname)) {
      return { type: "video", src: url };
    }
  } catch {
    // URL invalide
  }
  return null;
}

export default function VideoPlayer({ url }) {
  const media = toEmbed(url);

  if (!media) {
    return (
      <div className="alert alert-warning">
        Ce format de vidéo ne peut pas être lu ici.{" "}
        <a href={url} target="_blank" rel="noreferrer">Ouvrir la vidéo</a>
      </div>
    );
  }

  if (media.type === "video") {
    return <video src={media.src} controls className="w-100 rounded" style={{ maxHeight: 480 }} />;
  }

  return (
    <div className="ratio ratio-16x9">
      <iframe
        src={media.src}
        title="Lecteur vidéo"
        className="rounded"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}