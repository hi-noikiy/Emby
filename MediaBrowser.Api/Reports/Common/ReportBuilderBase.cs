﻿using MediaBrowser.Controller.Entities;
using MediaBrowser.Controller.Entities.Audio;
using MediaBrowser.Controller.Entities.TV;
using MediaBrowser.Controller.Library;
using MediaBrowser.Model.Channels;
using MediaBrowser.Model.Dto;
using MediaBrowser.Model.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MediaBrowser.Api.Reports
{
	/// <summary> A report builder base. </summary>
	public class ReportBuilderBase
	{
		/// <summary>
		/// Initializes a new instance of the MediaBrowser.Api.Reports.ReportBuilderBase class. </summary>
		/// <param name="libraryManager"> Manager for library. </param>
		public ReportBuilderBase(ILibraryManager libraryManager)
		{
			_libraryManager = libraryManager;
		}

		/// <summary> Manager for library. </summary>
		protected readonly ILibraryManager _libraryManager;

		/// <summary> Gets audio stream. </summary>
		/// <param name="item"> The item. </param>
		/// <returns> The audio stream. </returns>
		protected string GetAudioStream(BaseItem item)
		{
			var stream = GetStream(item, MediaStreamType.Audio);
			if (stream != null)
				return stream.Codec.ToUpper() == "DCA" ? stream.Profile : stream.Codec.
				ToUpper();

			return string.Empty;
		}

		/// <summary> Gets an episode. </summary>
		/// <param name="item"> The item. </param>
		/// <returns> The episode. </returns>
		protected string GetEpisode(BaseItem item)
		{

			if (item.GetClientTypeName() == ChannelMediaContentType.Episode.ToString() && item.ParentIndexNumber != null)
				return "Season " + item.ParentIndexNumber;
			else
				return item.Name;
		}

		/// <summary> Gets a genre. </summary>
		/// <param name="name"> The name. </param>
		/// <returns> The genre. </returns>
		protected Genre GetGenre(string name)
		{
			if (string.IsNullOrEmpty(name))
				return null;
			return _libraryManager.GetGenre(name);
		}

		/// <summary> Gets genre identifier. </summary>
		/// <param name="name"> The name. </param>
		/// <returns> The genre identifier. </returns>
		protected string GetGenreID(string name)
		{
			if (string.IsNullOrEmpty(name))
				return string.Empty;
			return string.Format("{0:N}",
					GetGenre(name).Id);
		}

		/// <summary> Gets list as string. </summary>
		/// <param name="items"> The items. </param>
		/// <returns> The list as string. </returns>
		protected string GetListAsString(List<string> items)
		{
			return String.Join("; ", items);
		}

		/// <summary> Gets media source information. </summary>
		/// <param name="item"> The item. </param>
		/// <returns> The media source information. </returns>
		protected MediaSourceInfo GetMediaSourceInfo(BaseItem item)
		{
			var mediaSource = item as IHasMediaSources;
			if (mediaSource != null)
				return mediaSource.GetMediaSources(false).FirstOrDefault(n => n.Type == MediaSourceType.Default);

			return null;
		}

		/// <summary> Gets an object. </summary>
		/// <typeparam name="T"> Generic type parameter. </typeparam>
		/// <typeparam name="R"> Type of the r. </typeparam>
		/// <param name="item"> The item. </param>
		/// <param name="function"> The function. </param>
		/// <param name="defaultValue"> The default value. </param>
		/// <returns> The object. </returns>
		protected R GetObject<T, R>(BaseItem item, Func<T, R> function, R defaultValue = default(R)) where T : class
		{
			var value = item as T;
			if (value != null && function != null)
				return function(value);
			else
				return defaultValue;
		}

		/// <summary> Gets a person. </summary>
		/// <param name="name"> The name. </param>
		/// <returns> The person. </returns>
		protected Person GetPerson(string name)
		{
			if (string.IsNullOrEmpty(name))
				return null;
			return _libraryManager.GetPerson(name);
		}

		/// <summary> Gets person identifier. </summary>
		/// <param name="name"> The name. </param>
		/// <returns> The person identifier. </returns>
		protected string GetPersonID(string name)
		{
			if (string.IsNullOrEmpty(name))
				return string.Empty;
			return string.Format("{0:N}",
					GetPerson(name).Id);
		}

		/// <summary> Gets runtime date time. </summary>
		/// <param name="runtime"> The runtime. </param>
		/// <returns> The runtime date time. </returns>
		protected DateTime? GetRuntimeDateTime(long? runtime)
		{
			if (runtime.HasValue)
				return new DateTime(runtime.Value);
			return null;
		}

		/// <summary> Gets series production year. </summary>
		/// <param name="item"> The item. </param>
		/// <returns> The series production year. </returns>
		protected string GetSeriesProductionYear(BaseItem item)
		{

			string productionYear = item.ProductionYear.ToString();
			var series = item as Series;
			if (series == null)
			{
				if (item.ProductionYear == null || item.ProductionYear == 0)
					return string.Empty;
				return productionYear;
			}

			if (series.Status == SeriesStatus.Continuing)
				return productionYear += "-Present";

			if (series.EndDate != null && series.EndDate.Value.Year != series.ProductionYear)
				return productionYear += "-" + series.EndDate.Value.Year;

			return productionYear;
		}

		/// <summary> Gets a stream. </summary>
		/// <param name="item"> The item. </param>
		/// <param name="streamType"> Type of the stream. </param>
		/// <returns> The stream. </returns>
		protected MediaStream GetStream(BaseItem item, MediaStreamType streamType)
		{
			var itemInfo = GetMediaSourceInfo(item);
			if (itemInfo != null)
				return itemInfo.MediaStreams.FirstOrDefault(n => n.Type == streamType);

			return null;
		}

		/// <summary> Gets a studio. </summary>
		/// <param name="name"> The name. </param>
		/// <returns> The studio. </returns>
		protected Studio GetStudio(string name)
		{
			if (string.IsNullOrEmpty(name))
				return null;
			return _libraryManager.GetStudio(name);
		}

		/// <summary> Gets studio identifier. </summary>
		/// <param name="name"> The name. </param>
		/// <returns> The studio identifier. </returns>
		protected string GetStudioID(string name)
		{
			if (string.IsNullOrEmpty(name))
				return string.Empty;
			return string.Format("{0:N}",
					GetStudio(name).Id);
		}

		/// <summary> Gets video resolution. </summary>
		/// <param name="item"> The item. </param>
		/// <returns> The video resolution. </returns>
		protected string GetVideoResolution(BaseItem item)
		{
			var stream = GetStream(item,
					MediaStreamType.Video);
			if (stream != null && stream.Width != null)
				return string.Format("{0} * {1}",
						stream.Width,
						(stream.Height != null ? stream.Height.ToString() : "-"));

			return string.Empty;
		}

		/// <summary> Gets video stream. </summary>
		/// <param name="item"> The item. </param>
		/// <returns> The video stream. </returns>
		protected string GetVideoStream(BaseItem item)
		{
			var stream = GetStream(item, MediaStreamType.Video);
			if (stream != null)
				return stream.Codec.ToUpper();

			return string.Empty;
		}

	}
}
